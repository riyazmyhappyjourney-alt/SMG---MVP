import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.jtawqvseigeslgbrphfl:Ziowlg3tbLyu0eq4@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const dups = [
      { phone: '+919739175543', ids: ['lead-mw5updk1-gedi', 'lead-fb-mw525rp1-12d07c'] },
      { phone: '+919605646731', ids: ['lead-fb-mw4m4dp6-74ff4e', 'lead-inv-22'] },
      { phone: '+919250099763', ids: ['lead-inv-15', 'lead-inv-16'] },
      { phone: '+918904922338', ids: ['lead-fb-mw4ob56a-8a15e6', 'lead-inv-24'] },
      { phone: '+917022628876', ids: ['lead-fb-mw52jvln-207c9f', 'lead-inv-26'] },
      { phone: '+918802904494', ids: ['enq-99a-mwiq7g53-3b5c7a', 'enq-99a-mwirhme1-351040'] }
    ];

    for (const item of dups) {
      console.log(`\n=================== Check Details for Phone: ${item.phone} ===================`);
      for (const id of item.ids) {
        const lead = await pool.query(`SELECT id, owner_name, phone, apartment_society_name, lead_status, created_at, notes FROM seller_leads WHERE id = $1;`, [id]);
        if (lead.rows.length > 0) {
          const l = lead.rows[0];
          console.log(`[SELLER LEAD] ID: ${l.id} | Name: ${l.owner_name} | Society: ${l.apartment_society_name} | Status: ${l.lead_status} | Created: ${l.created_at}`);
          const props = await pool.query(`SELECT id, title, slug, seller_lead_id FROM properties WHERE seller_lead_id = $1;`, [id]);
          console.log(`  Linked Properties:`, props.rows);
        } else {
          const enq = await pool.query(`SELECT id, buyer_name, phone, preferred_locality_or_society, lead_status, created_at, notes FROM buyer_enquiries WHERE id = $1;`, [id]);
          if (enq.rows.length > 0) {
            const e = enq.rows[0];
            console.log(`[BUYER ENQ] ID: ${e.id} | Name: ${e.buyer_name} | Society: ${e.preferred_locality_or_society} | Status: ${e.lead_status} | Created: ${e.created_at}`);
          }
        }
      }
    }
  } finally {
    await pool.end();
  }
}

main();
