import { Storage } from '@google-cloud/storage';
import { getValidatedConfig, ConfigurationError } from '../config/env';

/**
 * Google Cloud Storage Private Bucket Client
 * Region: asia-south1 (Mumbai)
 * 
 * [Fail-Closed Enforcement]:
 * Throws ConfigurationError if bucket is unconfigured or credentials are missing,
 * unless explicitly operating in sandbox test mode.
 */

let storageInstance: Storage | null = null;

function getStorageClient(projectId: string): Storage {
  if (!storageInstance) {
    storageInstance = new Storage({ projectId });
  }
  return storageInstance;
}

export interface SignedUrlRequest {
  storagePath: string;
  contentType: string;
  expiresInMinutes?: number;
}

/**
 * Generates a real V4 Signed URL for direct client-to-GCS upload.
 * Fails closed if credentials or bucket are missing.
 */
export async function generateV4SignedUploadUrl(req: SignedUrlRequest): Promise<string> {
  const config = getValidatedConfig();
  const expiresIn = (req.expiresInMinutes || 15) * 60 * 1000;

  try {
    const storage = getStorageClient(config.gcpProjectId);
    const bucket = storage.bucket(config.gcsPrivateBucket);
    const file = bucket.file(req.storagePath);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + expiresIn,
      contentType: req.contentType,
    });

    return signedUrl;
  } catch (err: any) {
    if (!config.allowSandbox) {
      throw new ConfigurationError(
        'GCS_CREDENTIALS',
        `Google Cloud Storage credentials failed to sign URL: ${err.message}. Fail-closed: cannot generate upload URL.`
      );
    }

    console.warn(
      `[GCS SANDBOX WARNING] Real GCS credentials not configured in current container environment (${err.message}). ` +
      `Returning formatted V4 signed URL structure strictly because ALLOW_DEV_FALLBACKS=true.`
    );
    const expiresInSec = expiresIn / 1000;
    return `https://storage.googleapis.com/${config.gcsPrivateBucket}/${req.storagePath}?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=service-account%40sellmyghar.iam.gserviceaccount.com&X-Goog-Date=${new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')}&X-Goog-Expires=${expiresInSec}&X-Goog-SignedHeaders=content-type%3Bhost&X-Goog-Signature=mock-sandbox-signature`;
  }
}
