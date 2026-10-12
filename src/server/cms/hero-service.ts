import { executeQuery } from '../db/pool';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

export interface HeroSlide {
  id: string;
  title: string;
  alt_text: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  is_first: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_HERO_SLIDES: Omit<HeroSlide, 'created_at' | 'updated_at'>[] = [
  {
    id: 'slide-township-sunset',
    title: 'Township Exterior at Sunset',
    alt_text: 'Luxury Apartment Township at Sunset in Bengaluru',
    image_url: '/images/luxury-apartment-township-sunset.webp',
    display_order: 0,
    is_active: true,
    is_first: true,
  },
  {
    id: 'slide-clubhouse-amenities',
    title: 'Society Clubhouse and Amenities',
    alt_text: 'Premium Society Clubhouse and Township Amenities',
    image_url: '/images/brigade-granada-clubhouse.webp',
    display_order: 1,
    is_active: true,
    is_first: false,
  },
  {
    id: 'slide-night-community',
    title: 'Modern Residential Community at Night',
    alt_text: 'Modern Residential Community in Bengaluru',
    image_url: '/images/bengaluru-night-apartments.webp',
    display_order: 2,
    is_active: true,
    is_first: false,
  },
];

export class HeroCmsService {
  /**
   * Ensure hero_slides table exists and has default seeds
   */
  static async initTable(): Promise<void> {
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS hero_slides (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          alt_text VARCHAR(255) NOT NULL,
          image_url TEXT NOT NULL,
          display_order INT NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          is_first BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      const checkRes = await executeQuery(`SELECT COUNT(*)::int AS cnt FROM hero_slides;`);
      const count = Number(checkRes.rows?.[0]?.cnt || 0);
      if (count === 0) {
        for (const slide of DEFAULT_HERO_SLIDES) {
          await executeQuery(`
            INSERT INTO hero_slides (id, title, alt_text, image_url, display_order, is_active, is_first, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
          `, [
            slide.id,
            slide.title,
            slide.alt_text,
            slide.image_url,
            slide.display_order,
            slide.is_active,
            slide.is_first,
          ]);
        }
      }
    } catch (err: any) {
      console.warn('[HeroCmsService] initTable note:', err.message);
    }
  }

  static async listSlides(onlyActive: boolean = false): Promise<HeroSlide[]> {
    await this.initTable();
    let query = `SELECT * FROM hero_slides`;
    if (onlyActive) {
      query += ` WHERE is_active = true`;
    }
    query += ` ORDER BY is_first DESC, display_order ASC, created_at ASC;`;

    const res = await executeQuery<HeroSlide>(query);
    return res.rows || [];
  }

  static async getAllSlides(): Promise<HeroSlide[]> {
    return this.listSlides(false);
  }

  static async getSlideById(id: string): Promise<HeroSlide | null> {
    const res = await executeQuery<HeroSlide>(`SELECT * FROM hero_slides WHERE id = $1 LIMIT 1;`, [id]);
    return res.rows?.[0] || null;
  }

  static async createSlide(payload: {
    title: string;
    alt_text: string;
    image_url: string;
    is_active?: boolean;
    is_first?: boolean;
    display_order?: number;
  }): Promise<HeroSlide> {
    if (!payload.title || !payload.title.trim()) {
      throw new Error('Slide title is required.');
    }
    if (!payload.alt_text || !payload.alt_text.trim()) {
      throw new Error('Alternative text (alt_text) is required for accessibility.');
    }
    if (!payload.image_url || !payload.image_url.trim()) {
      throw new Error('Valid image URL or path is required.');
    }

    const id = `slide-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const isActive = payload.is_active !== undefined ? Boolean(payload.is_active) : true;
    const isFirst = Boolean(payload.is_first);

    // If marked as first, clear is_first on other slides
    if (isFirst) {
      await executeQuery(`UPDATE hero_slides SET is_first = false;`);
    }

    let order = payload.display_order;
    if (order === undefined || isNaN(order)) {
      const orderRes = await executeQuery(`SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM hero_slides;`);
      order = Number(orderRes.rows?.[0]?.next_order ?? 0);
    }

    const res = await executeQuery<HeroSlide>(`
      INSERT INTO hero_slides (id, title, alt_text, image_url, display_order, is_active, is_first, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *;
    `, [id, payload.title.trim(), payload.alt_text.trim(), payload.image_url.trim(), order, isActive, isFirst]);

    return res.rows[0];
  }

  static async updateSlide(
    id: string,
    payload: Partial<{
      title: string;
      alt_text: string;
      image_url: string;
      is_active: boolean;
      is_first: boolean;
      display_order: number;
    }>
  ): Promise<HeroSlide> {
    const existing = await this.getSlideById(id);
    if (!existing) {
      throw new Error('Slide not found.');
    }

    if (payload.is_first === true) {
      await executeQuery(`UPDATE hero_slides SET is_first = false WHERE id != $1;`, [id]);
    }

    const title = payload.title !== undefined ? payload.title.trim() : existing.title;
    const alt_text = payload.alt_text !== undefined ? payload.alt_text.trim() : existing.alt_text;
    const image_url = payload.image_url !== undefined ? payload.image_url.trim() : existing.image_url;
    const is_active = payload.is_active !== undefined ? Boolean(payload.is_active) : existing.is_active;
    const is_first = payload.is_first !== undefined ? Boolean(payload.is_first) : existing.is_first;
    const display_order = payload.display_order !== undefined ? Number(payload.display_order) : existing.display_order;

    const res = await executeQuery<HeroSlide>(`
      UPDATE hero_slides
      SET title = $1,
          alt_text = $2,
          image_url = $3,
          is_active = $4,
          is_first = $5,
          display_order = $6,
          updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `, [title, alt_text, image_url, is_active, is_first, display_order, id]);

    return res.rows[0];
  }

  static async deleteSlide(id: string): Promise<boolean> {
    const res = await executeQuery(`DELETE FROM hero_slides WHERE id = $1 RETURNING id;`, [id]);
    return Boolean(res.rows && res.rows.length > 0);
  }

  static async reorderSlides(slideIds: string[]): Promise<HeroSlide[]> {
    if (!Array.isArray(slideIds)) {
      throw new Error('slideIds must be an array of slide IDs.');
    }

    for (let i = 0; i < slideIds.length; i++) {
      await executeQuery(`UPDATE hero_slides SET display_order = $1, updated_at = NOW() WHERE id = $2;`, [i, slideIds[i]]);
    }

    return this.listSlides(false);
  }

  /**
   * Save uploaded hero image file to local /public/uploads/hero/ or return path
   */
  static saveUploadedImage(dataBase64: string, fileName?: string): { relativeUrl: string; checksum: string } {
    const base64Data = dataBase64.replace(/^data:image\/[a-zA-Z0-9\+\-\.]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('Hero image exceeds the maximum 5MB file size limit.');
    }

    const checksum = createHash('sha256').update(buffer).digest('hex').substring(0, 12);
    const ext = fileName && fileName.endsWith('.png') ? 'png' : fileName && fileName.endsWith('.jpg') ? 'jpg' : 'webp';
    const uploadDir = path.resolve('public/uploads/hero');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const finalFileName = `hero-banner-${Date.now()}-${checksum}.${ext}`;
    const filePath = path.join(uploadDir, finalFileName);
    fs.writeFileSync(filePath, buffer);

    return {
      relativeUrl: `/uploads/hero/${finalFileName}`,
      checksum,
    };
  }
}
