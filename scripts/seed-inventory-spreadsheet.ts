import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.jtawqvseigeslgbrphfl:Ziowlg3tbLyu0eq4@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SPREADSHEET_INVENTORIES = [
  {
    projectName: 'Pyramid Bilberry',
    bhk: '2 BHK',
    superBuiltUpSqft: 1311,
    facing: 'EAST',
    furnishing: 'Semi-Furnished',
    unitFloor: 2,
    totalFloors: 4,
    balcony: 1,
    bathrooms: 2,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 9500000,
    closingPriceInr: 9200000,
    leadSource: 'Facebook',
    ownerName: 'Arul Nagaonka',
    ownerPhone: '+919663377077',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'pyramid-bilberry'
  },
  {
    projectName: 'Ds Max Stone Scape',
    bhk: '3 BHK',
    superBuiltUpSqft: 1347,
    facing: 'EAST',
    furnishing: 'Semi-Furnished',
    unitFloor: 2,
    totalFloors: 4,
    balcony: 1,
    bathrooms: 2,
    propertyAge: '5-6 years old',
    possession: 'Ready to Move',
    priceInr: 9100000,
    closingPriceInr: 8600000,
    leadSource: 'Facebook',
    ownerName: 'Sudhindra S M',
    ownerPhone: '+918861223063',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: true,
    slug: 'ds-max-stone-scape'
  },
  {
    projectName: 'Prestige Green Gables',
    bhk: '3.5 BHK',
    superBuiltUpSqft: 1910,
    facing: 'EAST',
    furnishing: 'Fully-Furnished',
    unitFloor: 11,
    totalFloors: 12,
    balcony: 2,
    bathrooms: 3,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 44000000,
    closingPriceInr: null,
    leadSource: 'Whatsapp Blast',
    ownerName: 'Pournima',
    ownerPhone: '+918790101631',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'prestige-green-gables'
  },
  {
    projectName: 'Sobha Brooklyn Towers',
    bhk: '3 BHK',
    superBuiltUpSqft: 1865,
    facing: 'EAST',
    furnishing: 'Unfurnished',
    unitFloor: 4,
    totalFloors: 36,
    balcony: 2,
    bathrooms: 3,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 25000000,
    closingPriceInr: null,
    leadSource: '99 Acres',
    ownerName: 'Pallabi',
    ownerPhone: '+919035589708',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'sobha-brooklyn-towers'
  },
  {
    projectName: 'RRBC Picasso',
    bhk: '3 BHK',
    superBuiltUpSqft: 2468,
    facing: 'NORTH_EAST',
    furnishing: 'Unfurnished',
    unitFloor: 10,
    totalFloors: 14,
    balcony: 2,
    bathrooms: 3,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 65000000,
    closingPriceInr: null,
    leadSource: '99 Acres',
    ownerName: 'Darshan',
    ownerPhone: 'Not Available',
    portal99Acres: true,
    portalMagicBricks: false,
    portalSellMyGhar: false,
    slug: 'rrbc-picasso'
  },
  {
    projectName: 'RRBC Picasso',
    bhk: '3 BHK',
    superBuiltUpSqft: 2119,
    facing: 'NORTH_EAST',
    furnishing: 'Unfurnished',
    unitFloor: 4,
    totalFloors: 14,
    balcony: 2,
    bathrooms: 3,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 45000000,
    closingPriceInr: null,
    leadSource: '99 Acres',
    ownerName: 'Suresh ( Security )',
    ownerPhone: '+919482007546',
    portal99Acres: true,
    portalMagicBricks: false,
    portalSellMyGhar: false,
    slug: 'rrbc-picasso-tower2'
  },
  {
    projectName: 'Orchid Piccadilly',
    bhk: '2 BHK',
    superBuiltUpSqft: 1176,
    facing: 'NORTH_EAST',
    furnishing: 'Semi-Furnished',
    unitFloor: 5,
    totalFloors: 12,
    balcony: 1,
    bathrooms: 2,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 15000000,
    closingPriceInr: null,
    leadSource: '99 Acres',
    ownerName: 'Kalim',
    ownerPhone: '+919980154597',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'orchid-piccadilly'
  },
  {
    projectName: 'Godrej Lakeside Orchard',
    bhk: '3 BHK',
    superBuiltUpSqft: 1578,
    facing: 'NORTH_EAST',
    furnishing: 'Unfurnished',
    unitFloor: 23,
    totalFloors: 25,
    balcony: 2,
    bathrooms: 3,
    propertyAge: null,
    possession: 'Under Construction',
    priceInr: 22000000,
    closingPriceInr: 21500000,
    leadSource: 'SMG',
    ownerName: 'Manoj',
    ownerPhone: '+917736529996',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: true,
    slug: 'godrej-lakeside-orchard'
  },
  {
    projectName: 'Godrej Lakeside Orchard',
    bhk: '3 BHK',
    superBuiltUpSqft: 1934,
    facing: 'EAST',
    furnishing: 'Unfurnished',
    unitFloor: 15,
    totalFloors: 25,
    balcony: 2,
    bathrooms: 3,
    propertyAge: null,
    possession: 'Under Construction',
    priceInr: 27600000,
    closingPriceInr: null,
    leadSource: '99 Acres',
    ownerName: 'Niranjan',
    ownerPhone: '+916291804642',
    portal99Acres: false,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'godrej-lakeside-orchard-1934'
  },
  {
    projectName: 'Prestige Gulmohar',
    bhk: '2 BHK',
    superBuiltUpSqft: 1377,
    facing: 'WEST',
    furnishing: 'Semi-Furnished',
    unitFloor: 4,
    totalFloors: 26,
    balcony: 1,
    bathrooms: 2,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 20000000,
    closingPriceInr: 19000000,
    leadSource: 'Old Client',
    ownerName: 'Bhopanna',
    ownerPhone: '+918095556109',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: true,
    slug: 'prestige-gulmohar'
  },
  {
    projectName: 'Sumadhura Sushantha',
    bhk: '2.5 BHK',
    superBuiltUpSqft: 1550,
    facing: 'EAST',
    furnishing: 'Fully-Furnished',
    unitFloor: 8,
    totalFloors: 14,
    balcony: 2,
    bathrooms: 2,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 19500000,
    closingPriceInr: null,
    leadSource: 'Facebook',
    ownerName: 'Ashpak Sayed',
    ownerPhone: '+919606382786',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'sumadhura-sushantha'
  },
  {
    projectName: 'Skylark Zenith',
    bhk: '2 BHK',
    superBuiltUpSqft: 923,
    facing: 'EAST',
    furnishing: 'Semi-Furnished',
    unitFloor: 2,
    totalFloors: 8,
    balcony: 2,
    bathrooms: 2,
    propertyAge: '13 years',
    possession: 'Ready to Move',
    priceInr: 8500000,
    closingPriceInr: 8000000,
    leadSource: 'Facebook',
    ownerName: 'Ayushman',
    ownerPhone: '+919886902512',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'skylark-zenith'
  },
  {
    projectName: 'Disha Pursuit of Elements',
    bhk: '3.5 BHK',
    superBuiltUpSqft: 2103,
    facing: 'EAST',
    furnishing: 'Unfurnished',
    unitFloor: 8,
    totalFloors: 30,
    balcony: 2,
    bathrooms: 3,
    propertyAge: null,
    possession: 'Jan 2027',
    priceInr: 23000000,
    closingPriceInr: null,
    leadSource: 'Facebook',
    ownerName: 'Krishna',
    ownerPhone: '+919945693878',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'disha-pursuit-of-elements'
  },
  {
    projectName: 'Prestige Park Grove',
    bhk: '4.5 BHK',
    superBuiltUpSqft: 2530,
    facing: 'NORTH_EAST',
    furnishing: 'Unfurnished',
    unitFloor: 33,
    totalFloors: 42,
    balcony: 3,
    bathrooms: 4,
    propertyAge: null,
    possession: 'Dec 2027',
    priceInr: 35000000,
    closingPriceInr: null,
    leadSource: 'SMG',
    ownerName: 'Krishna Raju',
    ownerPhone: '+919901199018',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'prestige-park-grove'
  },
  {
    projectName: 'Sobha Manhattan Towers',
    bhk: '3 BHK',
    superBuiltUpSqft: 1498,
    facing: 'WEST',
    furnishing: 'Unfurnished',
    unitFloor: 26,
    totalFloors: 38,
    balcony: 2,
    bathrooms: 3,
    propertyAge: null,
    possession: 'Dec 2026',
    priceInr: 19000000,
    closingPriceInr: 18000000,
    leadSource: 'SMG',
    ownerName: 'Bhageshwar',
    ownerPhone: '+919250099763',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: true,
    slug: 'sobha-manhattan-towers-26'
  },
  {
    projectName: 'Sobha Manhattan Towers',
    bhk: '3 BHK',
    superBuiltUpSqft: 1498,
    facing: 'EAST',
    furnishing: 'Unfurnished',
    unitFloor: 34,
    totalFloors: 38,
    balcony: 2,
    bathrooms: 3,
    propertyAge: null,
    possession: 'Dec 2026',
    priceInr: 19000000,
    closingPriceInr: 18000000,
    leadSource: 'SMG',
    ownerName: 'Bhageshwar',
    ownerPhone: '+919250099763',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: true,
    slug: 'sobha-manhattan-towers-34'
  },
  {
    projectName: 'Prestige City Aston Park',
    bhk: '3 BHK',
    superBuiltUpSqft: 2416,
    facing: 'EAST',
    furnishing: 'Unfurnished',
    unitFloor: 0,
    totalFloors: 1,
    balcony: 2,
    bathrooms: 3,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 31000000,
    closingPriceInr: 30000000,
    leadSource: 'SMG',
    ownerName: 'Not Available',
    ownerPhone: 'Not Available',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'prestige-city-aston-park'
  },
  {
    projectName: 'Sobha Brooklyn Towers',
    bhk: '3 BHK',
    superBuiltUpSqft: 1865,
    facing: 'EAST',
    furnishing: 'Unfurnished',
    unitFloor: 16,
    totalFloors: 36,
    balcony: 2,
    bathrooms: 3,
    propertyAge: null,
    possession: '/2027',
    priceInr: 24300000,
    closingPriceInr: 24000000,
    leadSource: 'SMG',
    ownerName: 'Rohan Kaul',
    ownerPhone: '+919510269694',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: true,
    slug: 'sobha-brooklyn-towers-16'
  },
  {
    projectName: 'Sobha Lake Garden',
    bhk: '2.5 BHK',
    superBuiltUpSqft: 1533,
    facing: 'WEST',
    furnishing: 'Unfurnished',
    unitFloor: 11,
    totalFloors: 18,
    balcony: 2,
    bathrooms: 2,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 20000000,
    closingPriceInr: 20000000,
    leadSource: 'SMG',
    ownerName: 'Not Available',
    ownerPhone: 'Not Available',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: true,
    slug: 'sobha-lake-garden'
  },
  {
    projectName: 'Prestige Meridian Park',
    bhk: '3 BHK',
    superBuiltUpSqft: 1630,
    facing: 'EAST',
    furnishing: 'Semi-Furnished',
    unitFloor: 7,
    totalFloors: 31,
    balcony: 2,
    bathrooms: 3,
    propertyAge: null,
    possession: 'Jan 2027',
    priceInr: 20500000,
    closingPriceInr: 20500000,
    leadSource: 'Whatsapp Blast',
    ownerName: 'Ramesh',
    ownerPhone: '+919845801529',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: true,
    slug: 'prestige-meridian-park'
  },
  {
    projectName: 'Sowparnika The Columns',
    bhk: '2 BHK',
    superBuiltUpSqft: 1305,
    facing: 'EAST',
    furnishing: 'Semi-Furnished',
    unitFloor: 3,
    totalFloors: 10,
    balcony: 1,
    bathrooms: 2,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 11000000,
    closingPriceInr: 12000000,
    leadSource: 'SMG',
    ownerName: 'Not Available',
    ownerPhone: 'Not Available',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'sowparnika-the-columns'
  },
  {
    projectName: 'Purva Zenium 2',
    bhk: '2 BHK',
    superBuiltUpSqft: 1056,
    facing: 'EAST',
    furnishing: 'Unfurnished',
    unitFloor: 11,
    totalFloors: 13,
    balcony: 1,
    bathrooms: 2,
    propertyAge: '4 Years',
    possession: 'Ready to Move',
    priceInr: 12000000,
    closingPriceInr: 12000000,
    leadSource: 'Facebook',
    ownerName: 'Sarita',
    ownerPhone: '+919605646731',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'purva-zenium-2'
  },
  {
    projectName: 'Royal View',
    bhk: '2 BHK',
    superBuiltUpSqft: 1250,
    facing: 'EAST',
    furnishing: 'Unfurnished',
    unitFloor: 8,
    totalFloors: 11,
    balcony: 1,
    bathrooms: 2,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 11500000,
    closingPriceInr: null,
    leadSource: 'Direct',
    ownerName: 'Hari Yaple',
    ownerPhone: '+919545438800',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'royal-view'
  },
  {
    projectName: 'Provident Botanico',
    bhk: '2 BHK',
    superBuiltUpSqft: 1059,
    facing: 'NORTH',
    furnishing: 'Unfurnished',
    unitFloor: 9,
    totalFloors: 24,
    balcony: 1,
    bathrooms: 2,
    propertyAge: null,
    possession: 'Under Construction',
    priceInr: 13000000,
    closingPriceInr: null,
    leadSource: 'Facebook',
    ownerName: 'Siva',
    ownerPhone: '+918904922338',
    portal99Acres: true,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'provident-botanico'
  },
  {
    projectName: 'Raiyaan Opel Apartment',
    bhk: '3 BHK',
    superBuiltUpSqft: 1600,
    facing: 'EAST',
    furnishing: 'Semi-Furnished',
    unitFloor: 2,
    totalFloors: 4,
    balcony: 1,
    bathrooms: 3,
    propertyAge: null,
    possession: 'Ready to Move',
    priceInr: 11000000,
    closingPriceInr: null,
    leadSource: 'Direct',
    ownerName: 'Not Available',
    ownerPhone: 'Not Available',
    portal99Acres: false,
    portalMagicBricks: false,
    portalSellMyGhar: false,
    slug: 'raiyaan-opel-apartment'
  },
  {
    projectName: 'DS Max Starry',
    bhk: '2 BHK',
    superBuiltUpSqft: 1282,
    facing: 'NORTH',
    furnishing: 'Fully-Furnished',
    unitFloor: 4,
    totalFloors: 4,
    balcony: 2,
    bathrooms: 2,
    propertyAge: '5 Years',
    possession: 'Ready to Move',
    priceInr: 8800000,
    closingPriceInr: null,
    leadSource: 'Facebook',
    ownerName: 'Mubeena',
    ownerPhone: '+917022628876',
    portal99Acres: false,
    portalMagicBricks: true,
    portalSellMyGhar: false,
    slug: 'ds-max-starry'
  }
];

async function seed() {
  console.log('[Seeder] Starting schema migration and spreadsheet data population...');

  // 1. Add missing columns to properties
  await pool.query(`
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS slug VARCHAR(120);
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS closing_price_inr BIGINT;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_age VARCHAR(64);
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS possession_status VARCHAR(64);
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS lead_source VARCHAR(64);
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_name VARCHAR(120);
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(32);
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS portal_99acres BOOLEAN DEFAULT false;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS portal_magicbricks BOOLEAN DEFAULT false;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS portal_sellmyghar BOOLEAN DEFAULT false;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS seller_lead_id VARCHAR(64);

    -- Relax constraints that may block inventory creation
    ALTER TABLE properties ALTER COLUMN wing_tower DROP NOT NULL;
    ALTER TABLE properties ALTER COLUMN unit_number DROP NOT NULL;
    ALTER TABLE properties ALTER COLUMN project_locality_id DROP NOT NULL;
    ALTER TABLE properties ALTER COLUMN owner_id DROP NOT NULL;

    ALTER TABLE properties ALTER COLUMN car_parks_count DROP NOT NULL;
    ALTER TABLE properties ALTER COLUMN reserve_minimum_price_inr DROP NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties (slug);
  `);
  console.log('[Seeder] Schema columns verified & relaxed.');

  // 2. Clear old test properties and dependent tables
  try { await pool.query(`DELETE FROM property_completion_tokens;`); } catch {}
  try { await pool.query(`DELETE FROM visits;`); } catch {}
  try { await pool.query(`DELETE FROM documents;`); } catch {}
  try { await pool.query(`DELETE FROM properties;`); } catch {}
  console.log('[Seeder] Cleared old test properties.');

  // 3. Insert all 26 spreadsheet properties and their linked seller leads
  for (let i = 0; i < SPREADSHEET_INVENTORIES.length; i++) {
    const item = SPREADSHEET_INVENTORIES[i];
    const propId = `prop-inv-${(i + 1).toString().padStart(2, '0')}`;
    const leadId = `lead-inv-${(i + 1).toString().padStart(2, '0')}`;
    const listingStatus = item.portalSellMyGhar ? 'PUBLISHED' : 'DRAFT';
    const crmStatus = item.portalSellMyGhar ? 'VERIFIED' : 'NEW';
    const title = `${item.projectName} - ${item.bhk}`;

    // 1. Insert inventory property first
    await pool.query(`
      INSERT INTO properties (
        id, title, description, property_type, bhk_type, project_locality_id,
        public_address, wing_tower, unit_number, unit_floor, total_floors,
        super_built_up_sqft, carpet_area_sqft, balconies_count, bathrooms_count,
        facing, car_parks_count, is_covered_parking,
        asking_price_inr, reserve_minimum_price_inr, closing_price_inr, monthly_maintenance_inr,
        occupancy_status, khata_type, encumbrance_status, listing_intent,
        crm_status, listing_status, slug, property_age,
        possession_status, lead_source, owner_name, owner_phone,
        portal_99acres, portal_magicbricks, portal_sellmyghar,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, 'Apartment', $4, $5,
        $6, 'Tower A', $7, $8, $9,
        $10, $11, $12, $13,
        $14, 1, true,
        $15, $15, $16, 3000,
        'VACANT', 'A_KHATA', 'CLEAR', 'SELL',
        $17, $18, $19, $20,
        $21, $22, $23, $24,
        $25, $26, $27,
        NOW(), NOW()
      );
    `, [
      propId,
      title,
      `${item.bhk} apartment in ${item.projectName}. Facing: ${item.facing}, Furnishing: ${item.furnishing}, Possession: ${item.possession}.`,
      item.bhk,
      `${item.projectName}, Bengaluru`,
      `${item.projectName}, Bengaluru, Karnataka`,
      `${item.unitFloor}0${i + 1}`,
      item.unitFloor,
      item.totalFloors,
      item.superBuiltUpSqft,
      Math.round(item.superBuiltUpSqft * 0.78),
      item.balcony,
      item.bathrooms,
      item.facing,
      item.priceInr,
      item.closingPriceInr,
      crmStatus,
      listingStatus,
      item.slug,
      item.propertyAge,
      item.possession,
      item.leadSource,
      item.ownerName,
      item.ownerPhone,
      item.portal99Acres,
      item.portalMagicBricks,
      item.portalSellMyGhar
    ]);

    // 2. Insert or update linked seller lead
    await pool.query(`
      INSERT INTO seller_leads (
        id, owner_name, phone, apartment_society_name, locality_id, bhk_type,
        expected_price_inr, listing_intent, lead_status, property_id, notes, temperature, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, 'Bengaluru', $5,
        $6, 'SELL', 'NEW', $7, $8, 'WARM', NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        owner_name = EXCLUDED.owner_name,
        phone = EXCLUDED.phone,
        property_id = EXCLUDED.property_id;
    `, [
      leadId,
      item.ownerName,
      item.ownerPhone,
      item.projectName,
      item.bhk,
      item.priceInr,
      propId,
      `[Source: ${item.leadSource}] Super Builtup: ${item.superBuiltUpSqft} sqft | Floor: ${item.unitFloor}/${item.totalFloors}`
    ]);

    // 3. Link lead back to property
    await pool.query(`UPDATE properties SET seller_lead_id = $1 WHERE id = $2;`, [leadId, propId]);
  }

  console.log(`[Seeder] Successfully seeded ${SPREADSHEET_INVENTORIES.length} spreadsheet inventory records!`);
  const publishedCount = SPREADSHEET_INVENTORIES.filter(s => s.portalSellMyGhar).length;
  console.log(`[Seeder] Published on BuyMyGhar: ${publishedCount} properties.`);
  console.log(`[Seeder] Draft Inventories: ${SPREADSHEET_INVENTORIES.length - publishedCount} properties.`);

  await pool.end();
}

seed().catch(err => {
  console.error('[Seeder] Error:', err);
  process.exit(1);
});
