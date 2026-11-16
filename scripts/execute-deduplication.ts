import pg from 'pg';
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

    console.log('--- Starting Safe De-duplication and Merge ---');

    // 1. Bhageshwar (+919250099763): Merge lead-inv-16 into lead-inv-15
    console.log('1. Merging Bhageshwar leads (lead-inv-16 -> lead-inv-15)...');
    await client.query(`
      UPDATE properties
      SET seller_lead_id = 'lead-inv-15'
      WHERE seller_lead_id = 'lead-inv-16';
    `);
    await client.query(`
      UPDATE seller_leads
      SET apartment_society_name = 'Sobha Manhattan Towers (Units 26/38 & 34/38)',
          notes = COALESCE(notes, '') || ' [Unified Lead: Owns Unit 26/38 & 34/38]'
      WHERE id = 'lead-inv-15';
    `);
    await client.query(`DELETE FROM seller_leads WHERE id = 'lead-inv-16';`);

    // 2. Sarita (+919605646731): Merge lead-fb-mw4m4dp6-74ff4e into lead-inv-22
    console.log('2. Merging Sarita leads (lead-fb-mw4m4dp6-74ff4e -> lead-inv-22)...');
    const saritaOld = await client.query(`SELECT * FROM seller_leads WHERE id = 'lead-fb-mw4m4dp6-74ff4e';`);
    if (saritaOld.rows.length > 0) {
      const oldNotes = saritaOld.rows[0].notes || '';
      const oldStatus = saritaOld.rows[0].lead_status || 'FOLLOW_UP';
      await client.query(`
        UPDATE seller_leads
        SET lead_status = $1,
            notes = COALESCE(notes, '') || ' [Merged FB Lead: ' || $2 || ']'
        WHERE id = 'lead-inv-22';
      `, [oldStatus, oldNotes]);
      await client.query(`DELETE FROM seller_leads WHERE id = 'lead-fb-mw4m4dp6-74ff4e';`);
    }

    // 3. Siva (+918904922338): Merge lead-fb-mw4ob56a-8a15e6 into lead-inv-24
    console.log('3. Merging Siva leads (lead-fb-mw4ob56a-8a15e6 -> lead-inv-24)...');
    const sivaOld = await client.query(`SELECT * FROM seller_leads WHERE id = 'lead-fb-mw4ob56a-8a15e6';`);
    if (sivaOld.rows.length > 0) {
      const oldNotes = sivaOld.rows[0].notes || '';
      const oldStatus = sivaOld.rows[0].lead_status || 'CONTACTED';
      await client.query(`
        UPDATE seller_leads
        SET lead_status = $1,
            notes = COALESCE(notes, '') || ' [Merged FB Lead: ' || $2 || ']'
        WHERE id = 'lead-inv-24';
      `, [oldStatus, oldNotes]);
      await client.query(`DELETE FROM seller_leads WHERE id = 'lead-fb-mw4ob56a-8a15e6';`);
    }

    // 4. Mubeena Fatima (+917022628876): Merge lead-fb-mw52jvln-207c9f into lead-inv-26
    console.log('4. Merging Mubeena Fatima leads (lead-fb-mw52jvln-207c9f -> lead-inv-26)...');
    const mubeenaOld = await client.query(`SELECT * FROM seller_leads WHERE id = 'lead-fb-mw52jvln-207c9f';`);
    if (mubeenaOld.rows.length > 0) {
      const oldNotes = mubeenaOld.rows[0].notes || '';
      const oldStatus = mubeenaOld.rows[0].lead_status || 'CONTACTED';
      await client.query(`
        UPDATE seller_leads
        SET owner_name = 'Mubeena Fatima',
            lead_status = $1,
            notes = COALESCE(notes, '') || ' [Merged FB Lead: ' || $2 || ']'
        WHERE id = 'lead-inv-26';
      `, [oldStatus, oldNotes]);
      await client.query(`DELETE FROM seller_leads WHERE id = 'lead-fb-mw52jvln-207c9f';`);
    }

    // 5. Debjit Basu (+919739175543): Remove duplicate lead-mw5updk1-gedi
    console.log('5. Removing duplicate Debjit Basu lead (lead-mw5updk1-gedi)...');
    await client.query(`DELETE FROM seller_leads WHERE id = 'lead-mw5updk1-gedi';`);

    // 6. Shivani Bhavnani (+918802904494): Remove duplicate enq-99a-mwirhme1-351040
    console.log('6. Removing duplicate Shivani Bhavnani buyer enquiry (enq-99a-mwirhme1-351040)...');
    await client.query(`DELETE FROM buyer_enquiries WHERE id = 'enq-99a-mwirhme1-351040';`);

    await client.query('COMMIT');
    console.log('--- De-duplication Successfully Committed! ---');

    // Verification
    console.log('\n--- Post De-duplication Verification ---');
    const remainingDups = await client.query(`
      SELECT 
        RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) as phone10,
        COUNT(*) as cnt,
        ARRAY_AGG(id) as ids,
        ARRAY_AGG(owner_name) as names
      FROM seller_leads
      WHERE phone IS NOT NULL AND LENGTH(phone) > 0
      GROUP BY RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)
      HAVING COUNT(*) > 1;
    `);
    console.log('Remaining duplicates in seller_leads:', remainingDups.rows);

    const remainingBuyerDups = await client.query(`
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
    console.log('Remaining duplicates in buyer_enquiries:', remainingBuyerDups.rows);

    const slCount = await client.query(`SELECT COUNT(*) as count FROM seller_leads;`);
    const beCount = await client.query(`SELECT COUNT(*) as count FROM buyer_enquiries;`);
    const propCount = await client.query(`SELECT COUNT(*) as count FROM properties;`);
    console.log(`\nFinal Clean Counts: seller_leads: ${slCount.rows[0].count}, buyer_enquiries: ${beCount.rows[0].count}, properties: ${propCount.rows[0].count}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during de-duplication:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
