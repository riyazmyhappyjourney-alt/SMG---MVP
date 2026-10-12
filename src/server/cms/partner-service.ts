import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import { executeQuery } from '../db/pool';

export interface PartnerLogoItem {
  id: string;
  name: string;
  logo_url: string;
  alt_text: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnerSectionSettings {
  heading: string;
  scroll_speed: 'slow' | 'normal' | 'fast';
  pause_on_hover: boolean;
}

export const DEFAULT_PARTNERS: Omit<PartnerLogoItem, 'created_at' | 'updated_at'>[] = [
  {
    id: 'partner-godrej',
    name: 'Godrej Properties',
    logo_url: '/images/partners/godrej.svg',
    alt_text: 'Godrej Properties Official Channel Partner',
    display_order: 0,
    is_active: true,
  },
  {
    id: 'partner-brigade',
    name: 'Brigade Group',
    logo_url: '/images/partners/brigade.svg',
    alt_text: 'Brigade Group Official Channel Partner',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'partner-sobha',
    name: 'Sobha Realty',
    logo_url: '/images/partners/sobha.svg',
    alt_text: 'Sobha Realty Official Channel Partner',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'partner-prestige',
    name: 'Prestige Group',
    logo_url: '/images/partners/Prestige_Group.png',
    alt_text: 'Prestige Group Official Channel Partner',
    display_order: 3,
    is_active: true,
  },
];

export class PartnerCmsService {
  /**
   * Initialize tables for partner logos and section configuration
   */
  static async initTable(): Promise<void> {
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS partner_logos (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          logo_url TEXT NOT NULL,
          alt_text VARCHAR(255) NOT NULL,
          display_order INT NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await executeQuery(`
        CREATE TABLE IF NOT EXISTS partner_section_settings (
          id VARCHAR(32) PRIMARY KEY,
          heading VARCHAR(255) NOT NULL,
          scroll_speed VARCHAR(32) NOT NULL DEFAULT 'normal',
          pause_on_hover BOOLEAN NOT NULL DEFAULT true,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // Seed settings if absent
      const setCheck = await executeQuery(`SELECT id FROM partner_section_settings WHERE id = 'default' LIMIT 1;`);
      if (!setCheck.rows || setCheck.rows.length === 0) {
        await executeQuery(`
          INSERT INTO partner_section_settings (id, heading, scroll_speed, pause_on_hover, updated_at)
          VALUES ('default', 'Trusted Channel Partners of', 'normal', true, NOW())
          ON CONFLICT (id) DO NOTHING;
        `);
      }

      // Seed default logos if table is empty
      const checkRes = await executeQuery(`SELECT COUNT(*)::int AS cnt FROM partner_logos;`);
      const count = Number(checkRes.rows?.[0]?.cnt || 0);
      if (count === 0) {
        for (const p of DEFAULT_PARTNERS) {
          await executeQuery(`
            INSERT INTO partner_logos (id, name, logo_url, alt_text, display_order, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
          `, [
            p.id,
            p.name,
            p.logo_url,
            p.alt_text,
            p.display_order,
            p.is_active,
          ]);
        }
      }
    } catch (err: any) {
      console.warn('[PartnerCmsService] initTable note:', err.message);
    }
  }

  /**
   * Save uploaded partner logo file to /public/images/partners/ or return safe URL
   */
  static saveUploadedLogo(dataBase64: string, fileName?: string): { relativeUrl: string; checksum: string } {
    if (!dataBase64 || typeof dataBase64 !== 'string') {
      throw new Error('No logo image data provided.');
    }

    const trimmed = dataBase64.trim();

    // If already a valid relative or absolute URL, return as-is
    if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { relativeUrl: trimmed, checksum: '' };
    }

    // Match data URI: data:image/(svg+xml|png|jpeg|jpg|webp);base64,<payload>
    const matches = trimmed.match(/^data:image\/([a-zA-Z0-9\+\-\.]+);base64,(.*)$/);
    let mimeSubtype = 'png';
    let rawBase64 = trimmed;

    if (matches) {
      mimeSubtype = matches[1].toLowerCase();
      rawBase64 = matches[2];
    } else {
      // If it starts with data: but NOT image/ (e.g. data:application/pdf or data:text/html)
      if (trimmed.startsWith('data:')) {
        throw new Error('Unsupported document format. Partner logos must be an image file (SVG, PNG, WebP, JPG).');
      }
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    if (buffer.length > 2 * 1024 * 1024) {
      throw new Error('Partner logo file size exceeds the 2MB limit.');
    }

    if (buffer.length === 0) {
      throw new Error('Empty file content received.');
    }

    // Determine extension
    let ext = 'png';
    if (mimeSubtype.includes('svg') || (fileName && fileName.toLowerCase().endsWith('.svg'))) {
      ext = 'svg';
    } else if (mimeSubtype.includes('webp') || (fileName && fileName.toLowerCase().endsWith('.webp'))) {
      ext = 'webp';
    } else if (
      mimeSubtype.includes('jpeg') ||
      mimeSubtype.includes('jpg') ||
      (fileName && (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')))
    ) {
      ext = 'jpg';
    }

    // Validation
    if (ext === 'svg') {
      const svgText = buffer.toString('utf-8');
      if (!svgText.includes('<svg')) {
        throw new Error('Invalid SVG file. Content does not contain a valid <svg> element.');
      }
      if (/<script[\s>]/i.test(svgText) || /javascript:/i.test(svgText)) {
        throw new Error('Security violation: Executable scripts are not allowed in SVG logos.');
      }
    } else {
      // Check magic numbers for binary images
      const isPng = buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      const isJpg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      const isRiffWebp = buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

      if (!isPng && !isJpg && !isRiffWebp) {
        throw new Error('Invalid image file format. Supported formats are SVG, PNG, WebP, and JPG.');
      }
    }

    const checksum = createHash('sha256').update(buffer).digest('hex').substring(0, 10);
    const uploadDir = path.resolve('public/images/partners');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanBase = fileName
      ? fileName.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24)
      : 'partner';
    const finalFileName = `${cleanBase}-${checksum}.${ext}`;
    const filePath = path.join(uploadDir, finalFileName);
    fs.writeFileSync(filePath, buffer);

    return {
      relativeUrl: `/images/partners/${finalFileName}`,
      checksum,
    };
  }

  static async listPartners(onlyActive: boolean = false): Promise<PartnerLogoItem[]> {
    await this.initTable();
    let query = `SELECT * FROM partner_logos`;
    if (onlyActive) {
      query += ` WHERE is_active = true`;
    }
    query += ` ORDER BY display_order ASC, created_at ASC;`;

    const res = await executeQuery<PartnerLogoItem>(query);
    return res.rows || [];
  }

  static async createPartner(payload: {
    name: string;
    logo_url: string;
    alt_text?: string;
    display_order?: number;
    is_active?: boolean;
  }): Promise<PartnerLogoItem> {
    await this.initTable();
    if (!payload.name || !payload.name.trim()) {
      throw new Error('Partner name is required.');
    }
    if (!payload.logo_url || !payload.logo_url.trim()) {
      throw new Error('Partner logo URL or image is required.');
    }

    let finalLogoUrl = payload.logo_url.trim();
    if (finalLogoUrl.startsWith('data:')) {
      const saved = this.saveUploadedLogo(finalLogoUrl, payload.name);
      finalLogoUrl = saved.relativeUrl;
    }

    const id = `partner-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const alt = payload.alt_text?.trim() || `${payload.name.trim()} Official Channel Partner`;
    const order = payload.display_order ?? 99;
    const active = payload.is_active ?? true;

    const res = await executeQuery<PartnerLogoItem>(`
      INSERT INTO partner_logos (id, name, logo_url, alt_text, display_order, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *;
    `, [id, payload.name.trim(), finalLogoUrl, alt, order, active]);

    return res.rows[0];
  }

  static async updatePartner(
    id: string,
    updates: Partial<Pick<PartnerLogoItem, 'name' | 'logo_url' | 'alt_text' | 'display_order' | 'is_active'>>
  ): Promise<PartnerLogoItem> {
    await this.initTable();

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name.trim());
    }
    if (updates.logo_url !== undefined) {
      let finalUrl = updates.logo_url.trim();
      if (finalUrl.startsWith('data:')) {
        const saved = this.saveUploadedLogo(finalUrl, updates.name);
        finalUrl = saved.relativeUrl;
      }
      fields.push(`logo_url = $${idx++}`);
      values.push(finalUrl);
    }
    if (updates.alt_text !== undefined) {
      fields.push(`alt_text = $${idx++}`);
      values.push(updates.alt_text.trim());
    }
    if (updates.display_order !== undefined) {
      fields.push(`display_order = $${idx++}`);
      values.push(updates.display_order);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(Boolean(updates.is_active));
    }

    if (fields.length === 0) {
      throw new Error('No valid fields supplied for update.');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE partner_logos
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;

    const res = await executeQuery<PartnerLogoItem>(query, values);
    if (!res.rows || res.rows.length === 0) {
      throw new Error(`Partner logo with id ${id} not found.`);
    }
    return res.rows[0];
  }

  static async deletePartner(id: string): Promise<boolean> {
    await this.initTable();
    const res = await executeQuery(`DELETE FROM partner_logos WHERE id = $1 RETURNING id;`, [id]);
    return Boolean(res.rows && res.rows.length > 0);
  }

  static async reorderPartners(orderedIds: string[]): Promise<void> {
    await this.initTable();
    for (let i = 0; i < orderedIds.length; i++) {
      await executeQuery(`
        UPDATE partner_logos 
        SET display_order = $1, updated_at = NOW() 
        WHERE id = $2;
      `, [i, orderedIds[i]]);
    }
  }

  static async getSectionSettings(): Promise<PartnerSectionSettings> {
    await this.initTable();
    const res = await executeQuery<any>(`SELECT * FROM partner_section_settings WHERE id = 'default' LIMIT 1;`);
    if (res.rows && res.rows.length > 0) {
      return {
        heading: res.rows[0].heading || 'Trusted Channel Partners of',
        scroll_speed: res.rows[0].scroll_speed || 'normal',
        pause_on_hover: res.rows[0].pause_on_hover !== false,
      };
    }
    return {
      heading: 'Trusted Channel Partners of',
      scroll_speed: 'normal',
      pause_on_hover: true,
    };
  }

  static async updateSectionSettings(updates: Partial<PartnerSectionSettings>): Promise<PartnerSectionSettings> {
    await this.initTable();
    const current = await this.getSectionSettings();
    const heading = updates.heading !== undefined ? updates.heading.trim() : current.heading;
    const speed = updates.scroll_speed || current.scroll_speed;
    const pause = updates.pause_on_hover !== undefined ? updates.pause_on_hover : current.pause_on_hover;

    await executeQuery(`
      INSERT INTO partner_section_settings (id, heading, scroll_speed, pause_on_hover, updated_at)
      VALUES ('default', $1, $2, $3, NOW())
      ON CONFLICT (id) DO UPDATE
      SET heading = EXCLUDED.heading,
          scroll_speed = EXCLUDED.scroll_speed,
          pause_on_hover = EXCLUDED.pause_on_hover,
          updated_at = NOW();
    `, [heading, speed, pause]);

    return { heading, scroll_speed: speed, pause_on_hover: pause };
  }
}
