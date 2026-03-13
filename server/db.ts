import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await pool.query(text, params);
  return result.rows[0] ?? null;
}

export async function initDb() {
  await pool.query(`
    ALTER TABLE tf_bookings ADD COLUMN IF NOT EXISTS ticket_id VARCHAR(20) UNIQUE;
    ALTER TABLE tf_bookings ADD COLUMN IF NOT EXISTS section VARCHAR(30);
    ALTER TABLE tf_bookings ADD COLUMN IF NOT EXISTS row_label VARCHAR(5);
    ALTER TABLE tf_bookings ADD COLUMN IF NOT EXISTS seat_number VARCHAR(10);
    ALTER TABLE tf_bookings ADD COLUMN IF NOT EXISTS resale_price INTEGER;
    ALTER TABLE tf_bookings ADD COLUMN IF NOT EXISTS ticket_origin VARCHAR(20) DEFAULT 'original';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tf_scan_logs (
      id SERIAL PRIMARY KEY,
      ticket_id VARCHAR(20) NOT NULL,
      scanned_at TIMESTAMP DEFAULT NOW(),
      result VARCHAR(30) NOT NULL,
      holder_name VARCHAR(100),
      match_info VARCHAR(200),
      note VARCHAR(200)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tf_resale_blocks (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      attempted_price INTEGER NOT NULL,
      max_allowed_price INTEGER NOT NULL,
      blocked_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Backfill missing ticket_ids for existing bookings
  await pool.query(`
    UPDATE tf_bookings
    SET
      ticket_id = CONCAT('TF', UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8))),
      section = CASE
        WHEN category='vip' THEN 'VIP-A'
        WHEN category='premium' THEN 'PREM-B'
        WHEN category='fanZone' THEN 'ZONE-D'
        ELSE 'STD-C'
      END,
      row_label = CHR(65 + (RANDOM()*5)::INT),
      seat_number = CAST(1 + (RANDOM()*29)::INT AS VARCHAR)
    WHERE ticket_id IS NULL;
  `);
}
