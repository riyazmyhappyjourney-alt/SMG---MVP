import { AuthenticatedUser } from '../../core/types/auth';

/**
 * PostgreSQL Session Context Wrapper for Row-Level Security (RLS)
 * 
 * In connection-pooled environments (e.g., pg-pool to Cloud SQL), 
 * connection state can bleed across requests if not scoped.
 * 
 * [Recommendation]: Use PostgreSQL's transaction-scoped `SET LOCAL` commands:
 * `SET LOCAL app.current_user_id = '...'`
 * `SET LOCAL app.current_user_roles = '...'`
 * 
 * Because `SET LOCAL` applies strictly to the current transaction block,
 * it automatically resets upon COMMIT or ROLLBACK when the connection is 
 * returned to the pool.
 */

export interface DbClient {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
}

export interface Pool {
  connect: () => Promise<DbConnection>;
}

export interface DbConnection {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  release: () => void;
}

/**
 * Executes a callback within an isolated database transaction with the 
 * authenticated user's identity bound to PostgreSQL session variables.
 */
export async function withUserSession<T>(
  pool: Pool,
  user: AuthenticatedUser,
  callback: (client: DbConnection) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Bind user identity and roles to transaction-local config
    // Escaped with query parameters to prevent SQL injection in config settings
    const roleString = user.roles.join(',');
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [user.uid]);
    await client.query("SELECT set_config('app.current_user_roles', $1, true)", [roleString]);

    // 2. Execute the business logic within RLS context
    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // 3. Guaranteed connection return to pool with clean state
    client.release();
  }
}
