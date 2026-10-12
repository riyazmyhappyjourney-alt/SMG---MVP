-- ====================================================================
-- SellMyGhar - User Base Purge Script
-- Targets: yashwantkeyan@gmail.com, socialmedia@myhappyjourney.com
-- ====================================================================

BEGIN;

-- 1. Remove linked OAuth / Social identities
DELETE FROM user_identities 
WHERE LOWER(email) IN ('yashwantkeyan@gmail.com', 'socialmedia@myhappyjourney.com')
   OR user_id IN (
     SELECT id FROM users 
     WHERE LOWER(email) IN ('yashwantkeyan@gmail.com', 'socialmedia@myhappyjourney.com')
   );

-- 2. Remove publication notification ledger logs
DELETE FROM publication_notifications 
WHERE LOWER(recipient) IN ('yashwantkeyan@gmail.com', 'socialmedia@myhappyjourney.com');

-- 3. Remove consents
DELETE FROM consents 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE LOWER(email) IN ('yashwantkeyan@gmail.com', 'socialmedia@myhappyjourney.com')
);

-- 4. Remove unconverted leads if associated with the users' phone
DELETE FROM seller_leads 
WHERE phone IN (
  SELECT phone FROM users 
  WHERE LOWER(email) IN ('yashwantkeyan@gmail.com', 'socialmedia@myhappyjourney.com')
    AND phone IS NOT NULL
);

-- 5. Permanently remove users from the core users table
DELETE FROM users 
WHERE LOWER(email) IN ('yashwantkeyan@gmail.com', 'socialmedia@myhappyjourney.com');

COMMIT;
