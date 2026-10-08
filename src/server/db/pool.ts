import pg from 'pg';
import { getValidatedConfig, ConfigurationError } from '../config/env';

const { Pool } = pg;

/**
 * PostgreSQL Connection Pool Manager
 * Configured for Google Cloud SQL (asia-south1, Mumbai)
 * 
 * [Fail-Closed Enforcement]:
 * Throws ConfigurationError if DATABASE_URL is missing,
 * unless explicitly operating in sandbox test mode with ALLOW_DEV_FALLBACKS=true.
 */

let poolInstance: pg.Pool | null = null;

type TestQueryHandler = (text: string, params?: unknown[]) => Promise<{ rows: any[] } | null> | { rows: any[] } | null;
let testQueryHandler: TestQueryHandler | null = null;

/**
 * Clean Test Double Hook: allows automated tests to supply query results
 * without embedding test-support state inside production domain services.
 */
export function setTestQueryHandler(handler: TestQueryHandler | null): void {
  testQueryHandler = handler;
}

export function getDbPool(): pg.Pool {
  if (!poolInstance) {
    const config = getValidatedConfig();

    if (!config.databaseUrl && !config.allowSandbox) {
      throw new ConfigurationError(
        'DATABASE_URL',
        'PostgreSQL connection string is required. Fail-closed: database operations cannot proceed.'
      );
    }

    if (!config.databaseUrl && config.allowSandbox) {
      // In sandbox mode without a real databaseUrl, DO NOT instantiate a real pg.Pool.
      // Return a mock pool object so zero real TCP connections are attempted.
      poolInstance = {
        query: async (text: string, params?: unknown[]) => {
          console.info(`[PG SANDBOX SQL INTERCEPT - Dev Only] ${text.replace(/\s+/g, ' ')}`, params || []);
          return { rows: [] };
        },
        connect: async () => ({
          query: async (sql: string, params?: unknown[]) => {
            console.info(`[PG SANDBOX SQL INTERCEPT - Dev Only] ${sql.replace(/\s+/g, ' ')}`, params || []);
            return { rows: [] };
          },
          release: () => {},
        }),
        end: async () => {},
        on: () => poolInstance,
      } as unknown as pg.Pool;
      return poolInstance;
    }

    const isRemote = config.databaseUrl.includes('supabase.co') || config.databaseUrl.includes('amazonaws.com') || config.databaseUrl.includes('cloudsql');

    const realPool = new Pool({
      connectionString: config.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: isRemote ? { rejectUnauthorized: false } : (config.isProduction ? { rejectUnauthorized: true } : false),
    });

    const origConnect = realPool.connect.bind(realPool);
    (realPool as any).connect = function (...args: any[]) {
      if (typeof args[0] === 'function') {
        const cb = args[0];
        return origConnect((err: any, client: any, release: any) => {
          if (err || !client) return cb(err, client, release);
          const origQuery = client.query.bind(client);
          client.query = async (text: any, params: any, queryCb?: any) => {
            if (testQueryHandler) {
              const testRes = await testQueryHandler(text, params);
              if (testRes !== null) {
                if (typeof queryCb === 'function') return queryCb(null, testRes);
                return testRes;
              }
            }
            return origQuery(text, params, queryCb);
          };
          return cb(null, client, release);
        });
      }

      return origConnect().then((client: any) => {
        const origQuery = client.query.bind(client);
        client.query = async (text: any, params: any, queryCb?: any) => {
          if (testQueryHandler) {
            const testRes = await testQueryHandler(text, params);
            if (testRes !== null) {
              if (typeof queryCb === 'function') return queryCb(null, testRes);
              return testRes;
            }
          }
          return origQuery(text, params, queryCb);
        };
        return client;
      });
    };

    poolInstance = realPool;
  }
  return poolInstance;
}

export const dbPool = getDbPool();

/**
 * Executes a parameterized query with strict fail-closed handling
 */
export async function executeQuery<T = any>(text: string, params?: unknown[]): Promise<{ rows: T[] }> {
  const config = getValidatedConfig();

  if (!config.databaseUrl && !config.allowSandbox) {
    throw new ConfigurationError(
      'DATABASE_URL',
      'Cannot execute query: DATABASE_URL is unset. Fail-closed: writes rejected.'
    );
  }

  // 1. Check test double handler if registered (for isolated unit testing)
  if (testQueryHandler) {
    const testResult = await testQueryHandler(text, params);
    if (testResult !== null) {
      return testResult as { rows: T[] };
    }
  }

  // 2. Direct sandbox interception BEFORE any connection attempt
  if (!config.databaseUrl && config.allowSandbox) {
    console.info(`[PG SANDBOX SQL INTERCEPT - Dev Only] ${text.replace(/\s+/g, ' ')}`, params || []);
    return { rows: [] };
  }

  const pool = getDbPool();
  const res = await pool.query(text, params);
  return res as { rows: T[] };
}
