const pg = require('pg');
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.jtawqvseigeslgbrphfl:Ziowlg3tbLyu0eq4@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('--- Cleaning Up Placeholder / Series Numbers ---');

    // 1. Update seller_leads
    const leadsRes = await client.query(`
      UPDATE seller_leads
      SET 
        owner_name = CASE 
          WHEN owner_name ILIKE '%Prestige Investor%' THEN 'Not Available'
          WHEN owner_name ILIKE '%Sobha Owner%' THEN 'Not Available'
          WHEN owner_name ILIKE '%Sowparnika Owner%' THEN 'Not Available'
          WHEN owner_name ILIKE '%Raiyaan Owner%' THEN 'Not Available'
          ELSE owner_name
        END,
        phone = 'Not Available',
        updated_at = NOW()
      WHERE phone IN (
        '+919876500001', '+919876500002', '+919876500003', '+919876500004', '+919880011223',
        '9876500001', '9876500002', '9876500003', '9876500004', '9880011223'
      ) OR phone LIKE '%987650000%'
      RETURNING id, owner_name, phone, apartment_society_name;
    `);

    console.log(`Updated ${leadsRes.rowCount} seller_leads records:`);
    leadsRes.rows.forEach(r => {
      console.log(`  - [${r.id}] ${r.owner_name} | Phone: ${r.phone} | Society: ${r.apartment_society_name}`);
    });

    // 2. Update properties
    const propsRes = await client.query(`
      UPDATE properties
      SET 
        owner_name = CASE 
          WHEN owner_name ILIKE '%Prestige Investor%' THEN 'Not Available'
          WHEN owner_name ILIKE '%Sobha Owner%' THEN 'Not Available'
          WHEN owner_name ILIKE '%Sowparnika Owner%' THEN 'Not Available'
          WHEN owner_name ILIKE '%Raiyaan Owner%' THEN 'Not Available'
          ELSE owner_name
        END,
        owner_phone = 'Not Available',
        updated_at = NOW()
      WHERE owner_phone IN (
        '+919876500001', '+919876500002', '+919876500003', '+919876500004', '+919880011223',
        '9876500001', '9876500002', '9876500003', '9876500004', '9880011223'
      ) OR owner_phone LIKE '%987650000%'
         OR title ILIKE '%Prestige City Aston Park%'
         OR title ILIKE '%sobha lake garden%'
         OR title ILIKE '%Sowparnika the Colums%'
         OR title ILIKE '%Raiyaan Opel%'
      RETURNING id, title, owner_name, owner_phone;
    `);

    console.log(`Updated ${propsRes.rowCount} properties records:`);
    propsRes.rows.forEach(p => {
      console.log(`  - [${p.id}] ${p.title} | Owner: ${p.owner_name} | Phone: ${p.owner_phone}`);
    });

    await client.query('COMMIT');
    console.log('--- Successfully updated all placeholder contacts to "Not Available" ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during update:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
