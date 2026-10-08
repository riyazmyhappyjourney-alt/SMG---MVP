import { getValidatedConfig, ConfigurationError } from './env';

/**
 * Fail-Closed Configuration Test Suite
 * Validates that missing credentials throw fatal ConfigurationErrors rather than silently falling back.
 */

export function runConfigTests(): { passed: number; failed: number; results: string[] } {
  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      passed++;
      results.push(`[PASS] ${testName}`);
    } else {
      failed++;
      results.push(`[FAIL] ${testName}`);
      console.error(`Assertion failed: ${testName}`);
    }
  };

  const originalEnv = { ...process.env };

  try {
    // TEST 1: Missing DATABASE_URL fails closed
    delete process.env.DATABASE_URL;
    delete process.env.ALLOW_DEV_FALLBACKS;
    try {
      getValidatedConfig({ allowSandbox: false });
      assert(false, 'TEST 1: Should have thrown ConfigurationError on missing DATABASE_URL');
    } catch (err: any) {
      assert(
        err instanceof ConfigurationError && err.missingKey === 'DATABASE_URL',
        'TEST 1: Missing DATABASE_URL throws fatal ConfigurationError'
      );
    }

    // TEST 2: Missing JWT_SECRET fails closed
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    delete process.env.JWT_SECRET;
    try {
      getValidatedConfig({ allowSandbox: false });
      assert(false, 'TEST 2: Should have thrown ConfigurationError on missing JWT_SECRET');
    } catch (err: any) {
      assert(
        err instanceof ConfigurationError && err.missingKey === 'JWT_SECRET',
        'TEST 2: Missing or short JWT_SECRET throws fatal ConfigurationError'
      );
    }

    // TEST 3: Insecure short JWT_SECRET fails closed (< 32 chars)
    process.env.JWT_SECRET = 'too-short-secret';
    try {
      getValidatedConfig({ allowSandbox: false });
      assert(false, 'TEST 3: Should have thrown on JWT_SECRET < 32 chars');
    } catch (err: any) {
      assert(
        err instanceof ConfigurationError && err.missingKey === 'JWT_SECRET',
        'TEST 3: JWT_SECRET under 32 characters is rejected'
      );
    }

    // Base valid config for isolation tests 4A and 4B
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.JWT_SECRET = 'this-is-a-valid-32-character-secret-key';
    process.env.NODE_ENV = 'production';

    // TEST 4A: Missing GCS_PRIVATE_BUCKET in production fails closed with exact key
    delete process.env.GCS_PRIVATE_BUCKET;
    process.env.REDIS_URL = 'redis://localhost:6379';
    try {
      getValidatedConfig({ allowSandbox: false });
      assert(false, 'TEST 4A: Should have thrown on missing GCS_PRIVATE_BUCKET');
    } catch (err: any) {
      assert(
        err instanceof ConfigurationError && err.missingKey === 'GCS_PRIVATE_BUCKET',
        'TEST 4A: Missing GCS_PRIVATE_BUCKET throws fatal ConfigurationError with exact key'
      );
    }

    // TEST 4B: Missing REDIS_URL in production fails closed with exact key
    process.env.GCS_PRIVATE_BUCKET = 'sellmyghar-vault-asia-south1';
    delete process.env.REDIS_URL;
    try {
      getValidatedConfig({ allowSandbox: false });
      assert(false, 'TEST 4B: Should have thrown on missing REDIS_URL');
    } catch (err: any) {
      assert(
        err instanceof ConfigurationError && err.missingKey === 'REDIS_URL',
        'TEST 4B: Missing REDIS_URL throws fatal ConfigurationError with exact key'
      );
    }

    // TEST 5: Explicit sandbox override allowed strictly in dev
    process.env.NODE_ENV = 'development';
    const sandboxConfig = getValidatedConfig({ allowSandbox: true });
    assert(
      sandboxConfig.allowSandbox === true,
      'TEST 5: Sandbox fallback is permitted only when explicitly requested in dev'
    );
  } finally {
    process.env = originalEnv;
  }

  return { passed, failed, results };
}
