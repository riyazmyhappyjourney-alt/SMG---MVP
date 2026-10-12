import { executeQuery } from '../src/server/db/pool';
import { devSandboxStore } from '../src/server/db/dev-sandbox-store';

export const TARGET_EMAILS_TO_PURGE = [
  'yashwantkeyan@gmail.com',
  'socialmedia@myhappyjourney.com',
];

export async function runPurge(emails: string[] = TARGET_EMAILS_TO_PURGE) {
  console.log('=== SellMyGhar User Base Purge Utility ===');
  const results: Record<string, any> = {};

  for (const rawEmail of emails) {
    const email = rawEmail.trim().toLowerCase();
    console.log(`\nProcessing email: ${email}`);

    // 1. In-Memory Sandbox Store Purge
    const removedFromSandbox = devSandboxStore.purgeUserByEmail(email);
    console.log(`  - devSandboxStore purge: ${removedFromSandbox ? 'REMOVED' : 'NOT_FOUND_IN_CACHE'}`);

    // 2. Query matching users in database
    const usersBefore = await executeQuery<{ id: string; display_name: string; phone: string }>(
      `SELECT id, display_name, phone FROM users WHERE LOWER(email) = $1;`,
      [email]
    );

    const userCount = usersBefore.rows?.length || 0;
    console.log(`  - Database matching records: ${userCount}`);

    // 3. Cascade Delete Linked Identities
    await executeQuery(
      `DELETE FROM user_identities WHERE LOWER(email) = $1;`,
      [email]
    ).catch(() => {});

    // 4. Cascade Delete Publication Notifications / Ledgers
    await executeQuery(
      `DELETE FROM publication_notifications WHERE LOWER(recipient) = $1;`,
      [email]
    ).catch(() => {});

    // 5. Delete from Users
    const delRes = await executeQuery(
      `DELETE FROM users WHERE LOWER(email) = $1;`,
      [email]
    ).catch((err: any) => ({ error: err.message }));

    // 6. Verify Deletion
    const usersAfter = await executeQuery(
      `SELECT id FROM users WHERE LOWER(email) = $1;`,
      [email]
    );

    const remainingCount = usersAfter.rows?.length || 0;
    const isClean = remainingCount === 0;

    console.log(`  - Final status: ${isClean ? 'PURGED_CLEAN (0 remaining)' : `WARNING: ${remainingCount} remaining`}`);

    results[email] = {
      previouslyFound: userCount,
      remaining: remainingCount,
      status: isClean ? 'SUCCESS_PURGED' : 'FAILED',
    };
  }

  console.log('\n=== Purge Summary ===');
  console.table(results);
  return results;
}

// Execute immediately if invoked directly
runPurge()
  .then(() => {
    console.log('\n[Purge] Completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n[Purge] Error during execution:', err);
    process.exit(1);
  });
