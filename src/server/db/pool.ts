import pg from 'pg';
import { EventEmitter } from 'events';
import { getValidatedConfig, ConfigurationError } from '../config/env';
import { devSandboxStore } from './dev-sandbox-store';
import { withUserSession, DbConnection } from './session';
import { AuthenticatedUser } from '../../core/types/auth';

const { Pool } = pg;

export class SandboxDbClient extends EventEmitter implements DbConnection {
  public readonly clientId: string = `client-${Math.random().toString(36).substring(2, 9)}`;

  async query(text: any, params?: any, queryCb?: any): Promise<any> {
    if (typeof params === 'function') {
      queryCb = params;
      params = [];
    }
    try {
      if (testQueryHandler) {
        const testRes = await testQueryHandler(text, params);
        if (testRes !== null) {
          if (typeof queryCb === 'function') return queryCb(null, testRes);
          return testRes;
        }
      }
      const res = devSandboxStore.handleQuery(text, (params as any[]) || [], this.clientId);
      if (typeof queryCb === 'function') return queryCb(null, res);
      return res;
    } catch (err: any) {
      if (typeof queryCb === 'function') return queryCb(err);
      throw err;
    }
  }

  release(_err?: any) {
    devSandboxStore.rollbackTx(this.clientId);
    this.emit('release');
  }
}

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
let lastSandboxWarningTime = 0;
function logSandboxWarning(msg: string): void {
  const now = Date.now();
  if (now - lastSandboxWarningTime > 60000) {
    console.warn(msg);
    lastSandboxWarningTime = now;
  }
}

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
        connect: async () => new SandboxDbClient(),
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
          if (err || !client) {
            if (config.allowSandbox) {
              logSandboxWarning(`[Dev Sandbox] Database connection unavailable (${err?.message || 'connection failed'}) — falling back to sandbox client`);
              const sandboxClient = new SandboxDbClient();
              return cb(null, sandboxClient, () => sandboxClient.release());
            }
            return cb(err, client, release);
          }
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
      }).catch((err: any) => {
        if (config.allowSandbox) {
          logSandboxWarning(`[Dev Sandbox] Database connection unavailable (${err?.message || 'connection failed'}) — falling back to sandbox client`);
          return new SandboxDbClient();
        }
        throw err;
      });
    };

    const origPoolQuery = realPool.query.bind(realPool);
    (realPool as any).query = async function (text: any, params?: any, ...rest: any[]) {
      if (testQueryHandler) {
        const testRes = await testQueryHandler(text, params);
        if (testRes !== null) return testRes;
      }
      try {
        return await (origPoolQuery as any)(text, params, ...rest);
      } catch (err: any) {
        if (config.allowSandbox) {
          logSandboxWarning(`[Dev Sandbox] Database pool query unavailable (${err?.message || 'query failed'}) — falling back to sandbox store`);
          return devSandboxStore.handleQuery(text, (params as any[]) || []);
        }
        throw err;
      }
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
      logSandboxWarning(`[Dev Sandbox] Database connection unavailable (${err.message}) — falling back to sandbox store`);
      const res = devSandboxStore.handleQuery(text, (params as any[]) || []);
      return res as { rows: T[] };
    }
    throw err;
  }
}

/**
 * Execute a transaction-scoped query with PostgreSQL Row-Level Security (RLS)
 * variables (app.current_user_id and app.current_user_roles) bound to the authenticated user.
 */
export async function executeUserQuery<T = any>(
  user: AuthenticatedUser,
  callback: (client: DbConnection) => Promise<T>
): Promise<T> {
  const pool = getDbPool();
  return withUserSession(pool, user, callback);
}
