import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.jtawqvseigeslgbrphfl:Ziowlg3tbLyu0eq4@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('--- Checking Duplicate Phone Numbers in seller_leads ---');
    const phoneDups = await pool.query(`
      SELECT phone, COUNT(*) as count, ARRAY_AGG(id) as ids, ARRAY_AGG(owner_name) as names
      FROM seller_leads
      GROUP BY phone
      HAVING COUNT(*) > 1;
    `);
    console.log('Duplicate phones in seller_leads:', JSON.stringify(phoneDups.rows, null, 2));

    console.log('\n--- Checking Duplicate Phone Numbers in buyer_enquiries ---');
    const buyerPhoneDups = await pool.query(`
      SELECT phone, COUNT(*) as count, ARRAY_AGG(id) as ids, ARRAY_AGG(buyer_name) as names
      FROM buyer_enquiries
      GROUP BY phone
      HAVING COUNT(*) > 1;
    `);
    console.log('Duplicate phones in buyer_enquiries:', JSON.stringify(buyerPhoneDups.rows, null, 2));

    console.log('\n--- Checking Overlap Between seller_leads and buyer_enquiries ---');
    const crossDups = await pool.query(`
      SELECT sl.phone, sl.id as seller_lead_id, sl.owner_name, be.id as buyer_lead_id, be.buyer_name
      FROM seller_leads sl
      JOIN buyer_enquiries be ON sl.phone = be.phone;
    `);
    console.log('Cross phone overlap:', JSON.stringify(crossDups.rows, null, 2));

    console.log('\n--- Total Lead Counts ---');
    const slCount = await pool.query(`SELECT COUNT(*) as count FROM seller_leads;`);
    const beCount = await pool.query(`SELECT COUNT(*) as count FROM buyer_enquiries;`);
    const propCount = await pool.query(`SELECT COUNT(*) as count FROM properties;`);
    console.log(`seller_leads: ${slCount.rows[0].count}, buyer_enquiries: ${beCount.rows[0].count}, properties: ${propCount.rows[0].count}`);

  } catch (err) {
    console.error('Error checking duplicates:', err);
  } finally {
    await pool.end();
  }
}

main();
