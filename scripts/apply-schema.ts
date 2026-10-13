import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

async function applySchema() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database to apply schemas...');
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }, // for Cloud/Supabase connections
  });

  try {
    await client.connect();
    console.log('Successfully connected to PostgreSQL database.');

    const schemaFile = process.argv[2] || 'src/server/db/staging-schema.sql';
    const sqlPath = path.resolve(process.cwd(), schemaFile);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`Applying schema from ${schemaFile}...`);
    await client.query(sql);

    console.log('Verifying created tables in information_schema...');
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Tables currently in database:');
    res.rows.forEach(r => console.log(`  - ${r.table_name}`));
    console.log('Schema migration complete.');
  } catch (err) {
    console.error('Failed to apply database schema:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();
