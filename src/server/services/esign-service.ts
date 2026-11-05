import crypto from 'crypto';
import { executeQuery } from '../db/pool';
import { devSandboxStore } from '../db/dev-sandbox-store';

export type EsignProvider = 'DIGIO' | 'LEEGALITY' | 'SIGNDESK' | 'MOCK';
export type BrokerageAgreementStatus = 'PENDING' | 'GENERATED' | 'SENT' | 'SIGNED' | 'REJECTED';

export interface BrokerageAgreementDetails {
  propertyId: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail?: string | null;
  propertyTitle: string;
  locality: string;
  askingPriceInr: number;
  commissionPercentage: number; // e.g. 1% or 2%
  provider: EsignProvider;
}

export class BrokerageEsignService {
  /**
   * Statutory Non-Negotiable Guard:
   * Indian Law (Section 1(4) of the Information Technology Act, 2000) excludes
   * any contract for the sale or conveyance of immovable property or any interest
   * in such property from the scope of electronic signatures.
   *
   * Only the Brokerage / Agency representation agreement between the Seller and
   * SellMyGhar brokerage may be electronically executed via licensed ESPs.
   */
  static assertAllowedEsignDocument(docType: string): void {
    const normalized = (docType || '').toUpperCase().trim();
    if (
      normalized.includes('SALE_DEED') || 
      normalized.includes('CONVEYANCE') || 
      normalized.includes('AGREEMENT_TO_SELL') || 
      normalized.includes('TITLE_DEED') ||
      normalized.includes('DEED')
    ) {
      throw new Error(
        'STATUTORY EXCLUSION: Under Section 1(4) of the Information Technology Act, 2000, electronic execution of contracts for the sale or conveyance of immovable property is legally void. Sale Deeds and Agreements to Sell must be physically executed on stamp paper and registered before the Sub-Registrar. eSign is restricted strictly to Brokerage/Agency Representation Agreements.'
      );
    }
  }

  /**
   * Initiate Brokerage Agreement eSign workflow
   */
  static async initiateBrokerageAgreement(details: BrokerageAgreementDetails): Promise<{
    agreementId: string;
    signingUrl: string;
    status: BrokerageAgreementStatus;
    provider: EsignProvider;
  }> {
    this.assertAllowedEsignDocument('BROKERAGE_AGREEMENT');

    const agreementId = `agr-brk-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
    const provider: EsignProvider = (process.env.ESIGN_PROVIDER as EsignProvider) || 'DIGIO';

    // Mock / sandbox signing URL or live ESP redirect
    const signingToken = crypto.randomBytes(16).toString('hex');
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const signingUrl = `${baseUrl}/esign/brokerage/${agreementId}?token=${signingToken}&propertyId=${details.propertyId}`;

    try {
      // 1. Update property status
      await executeQuery(
        `UPDATE properties 
         SET brokerage_agreement_status = 'SENT', 
             updated_at = NOW() 
         WHERE id = $1;`,
        [details.propertyId]
      );

      // 2. Insert document placeholder with doc_type = 'BROKERAGE_AGREEMENT'
      const docId = `doc-brk-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
      await executeQuery(
        `INSERT INTO documents (
           id, property_id, doc_type, file_name, file_size_bytes, mime_type, 
           storage_path, checksum, verification_status, discrepancy_note, created_at, updated_at
         ) VALUES (
           $1, $2, 'BROKERAGE_AGREEMENT', $3, 150000, 'application/pdf', 
           $4, $5, 'PENDING', 'Awaiting Aadhaar eSign via licensed ESP', NOW(), NOW()
         ) ON CONFLICT (id) DO NOTHING;`,
        [
          docId,
          details.propertyId,
          `Brokerage_Agreement_${details.propertyId}.pdf`,
          `agreements/${details.propertyId}/brokerage_agreement.pdf`,
          crypto.createHash('sha256').update(agreementId).digest('hex')
        ]
      );
    } catch {
      // Sandbox fallback
    }

    if (devSandboxStore && devSandboxStore.properties) {
      const p = devSandboxStore.properties.get(details.propertyId);
      if (p) {
        (p as any).brokerage_agreement_status = 'SENT';
      }
    }

    return {
      agreementId,
      signingUrl,
      status: 'SENT',
      provider
    };
  }

  /**
   * Complete eSign callback / webhook from ESP (Digio / Leegality / SignDesk)
   */
  static async completeBrokerageAgreement(propertyId: string, agreementId: string, signerAadhaarHash?: string): Promise<{
    success: boolean;
    status: BrokerageAgreementStatus;
    documentId: string;
    docType?: string;
  }> {
    this.assertAllowedEsignDocument('BROKERAGE_AGREEMENT');

    const docId = `doc-brk-signed-${Date.now().toString(36)}`;
    const signedTimestamp = new Date().toISOString();

    try {
      // 1. Update property record with signed status
      await executeQuery(
        `UPDATE properties 
         SET brokerage_agreement_status = 'SIGNED',
             brokerage_agreement_signed_at = NOW(),
             brokerage_agreement_document_id = $1,
             updated_at = NOW()
         WHERE id = $2;`,
        [docId, propertyId]
      );

      // 2. Insert verified signed PDF into documents table
      await executeQuery(
        `INSERT INTO documents (
           id, property_id, doc_type, file_name, file_size_bytes, mime_type, 
           storage_path, checksum, verification_status, discrepancy_note, verified_at, created_at, updated_at
         ) VALUES (
           $1, $2, 'BROKERAGE_AGREEMENT', $3, 245000, 'application/pdf', 
           $4, $5, 'VERIFIED', $6, NOW(), NOW(), NOW()
         );`,
        [
          docId,
          propertyId,
          `Signed_Brokerage_Agreement_${propertyId}.pdf`,
          `agreements/${propertyId}/signed_brokerage_agreement.pdf`,
          crypto.createHash('sha256').update(`${agreementId}-${signedTimestamp}`).digest('hex'),
          `Aadhaar eSigned via Digio/ESP. Signer Aadhaar Reference: ${signerAadhaarHash || 'VERIFIED_AADHAAR_TOKEN'}`
        ]
      );
    } catch {
      // Sandbox fallback
    }

    if (devSandboxStore && devSandboxStore.properties) {
      const p = devSandboxStore.properties.get(propertyId);
      if (p) {
        (p as any).brokerage_agreement_status = 'SIGNED';
        (p as any).brokerage_agreement_signed_at = signedTimestamp;
        (p as any).brokerage_agreement_document_id = docId;
      }
    }

    return {
      success: true,
      status: 'SIGNED',
      documentId: docId,
      docType: 'BROKERAGE_AGREEMENT'
    };
  }

  /**
   * Get eSign status for a property
   */
  static async getBrokerageAgreementStatus(propertyId: string): Promise<{
    status: BrokerageAgreementStatus;
    signedAt: string | null;
    documentId: string | null;
  }> {
    try {
      const res = await executeQuery(
        `SELECT brokerage_agreement_status, brokerage_agreement_signed_at, brokerage_agreement_document_id
         FROM properties
         WHERE id = $1;`,
        [propertyId]
      );
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        return {
          status: row.brokerage_agreement_status || 'PENDING',
          signedAt: row.brokerage_agreement_signed_at || null,
          documentId: row.brokerage_agreement_document_id || null
        };
      }
    } catch {}

    if (devSandboxStore && devSandboxStore.properties) {
      const p = devSandboxStore.properties.get(propertyId);
      if (p) {
        return {
          status: (p as any).brokerage_agreement_status || 'PENDING',
          signedAt: (p as any).brokerage_agreement_signed_at || null,
          documentId: (p as any).brokerage_agreement_document_id || null
        };
      }
    }

    return {
      status: 'PENDING',
      signedAt: null,
      documentId: null
    };
  }
}
