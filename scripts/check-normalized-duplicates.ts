import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.jtawqvseigeslgbrphfl:Ziowlg3tbLyu0eq4@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check normalized phone duplicates (stripping all non-digits, taking last 10 digits)
    const normalizedDups = await pool.query(`
      SELECT 
        RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) as phone10,
        COUNT(*) as cnt,
        ARRAY_AGG(id) as ids,
        ARRAY_AGG(owner_name) as names,
        ARRAY_AGG(apartment_society_name) as societies
      FROM seller_leads
      WHERE phone IS NOT NULL AND LENGTH(phone) > 0
      GROUP BY RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)
      HAVING COUNT(*) > 1;
    `);

    console.log('Normalized phone duplicates in seller_leads:');
    console.log(JSON.stringify(normalizedDups.rows, null, 2));

    const buyerNormDups = await pool.query(`
      SELECT 
        RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) as phone10,
        COUNT(*) as cnt,
        ARRAY_AGG(id) as ids,
        ARRAY_AGG(buyer_name) as names
      FROM buyer_enquiries
      WHERE phone IS NOT NULL AND LENGTH(phone) > 0
      GROUP BY RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)
      HAVING COUNT(*) > 1;
    `);

    console.log('Normalized phone duplicates in buyer_enquiries:');
    console.log(JSON.stringify(buyerNormDups.rows, null, 2));

  } finally {
    await pool.end();
  }
}

main();
