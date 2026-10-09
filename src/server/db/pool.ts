import pg from 'pg';
import { getValidatedConfig, ConfigurationError } from '../config/env';
import { devSandboxStore } from './dev-sandbox-store';

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

function isDummyDatabaseUrl(url: string | undefined): boolean {
  if (!url) return true;
  return (
    url.includes('127.0.0.1') ||
    url.includes('localhost') ||
    url.includes('your_secure_db_password')
  );
}

export function getDbPool(): pg.Pool {
  if (!poolInstance) {
    const config = getValidatedConfig();
    const isDummy = isDummyDatabaseUrl(config.databaseUrl);

    if (isDummy && !config.allowSandbox) {
      throw new ConfigurationError(
        'DATABASE_URL',
        'PostgreSQL connection string is required. Fail-closed: database operations cannot proceed.'
      );
    }

    if (isDummy && config.allowSandbox) {
      // In sandbox mode without a real databaseUrl, route queries to stateful devSandboxStore
      poolInstance = {
        query: async (text: string, params?: unknown[]) => {
          if (testQueryHandler) {
            const testRes = await testQueryHandler(text, params as any[]);
            if (testRes !== null) return testRes;
          }
          return devSandboxStore.handleQuery(text, (params as any[]) || []);
        },
        connect: async () => ({
          query: async (sql: string, params?: unknown[]) => {
            if (testQueryHandler) {
              const testRes = await testQueryHandler(sql, params as any[]);
              if (testRes !== null) return testRes;
            }
            return devSandboxStore.handleQuery(sql, (params as any[]) || []);
          },
          release: () => {},
        }),
        end: async () => {},
        on: () => poolInstance,
      } as unknown as pg.Pool;
      return poolInstance;
    }

    const isRemote = config.databaseUrl.includes('supabase.co') || config.databaseUrl.includes('amazonaws.com') || config.databaseUrl.includes('cloudsql');
    const allowInsecureSsl = process.env.PG_SSL_ALLOW_INSECURE === 'true' || (!config.isProduction);
    const sslConfig = isRemote
      ? (allowInsecureSsl ? { rejectUnauthorized: false } : { rejectUnauthorized: true })
      : (config.isProduction ? { rejectUnauthorized: true } : false);

    const realPool = new Pool({
      connectionString: config.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: sslConfig,
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
  const isDummy = isDummyDatabaseUrl(config.databaseUrl);

  if (isDummy && !config.allowSandbox) {
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
  if (isDummy && config.allowSandbox) {
    const res = devSandboxStore.handleQuery(text, (params as any[]) || []);
    return res as { rows: T[] };
  }

  try {
    const pool = getDbPool();
    const res = await pool.query(text, params);
    return res as { rows: T[] };
  } catch (err: any) {
    if (config.allowSandbox) {
      console.warn(`[Dev Sandbox] Database connection unavailable (${err.message}) — falling back to sandbox store`);
      const res = devSandboxStore.handleQuery(text, (params as any[]) || []);
      return res as { rows: T[] };
    }
    throw err;
  }
}
