import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { dbLogger } from '@/lib/logger';

const client = new SecretManagerServiceClient();

export async function loadSecrets() {
  if (process.env.GOOGLE_API_KEY) {
    dbLogger.info('GOOGLE_API_KEY is already set from environment. Skipping Secret Manager.');
    return;
  }

  const secretName = process.env.GEMINI_API_KEY_SECRET;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

  if (!secretName || !projectId) {
    dbLogger.warn('GEMINI_API_KEY_SECRET or GOOGLE_CLOUD_PROJECT not set. Unable to fetch secret from Secret Manager.');
    return;
  }

  try {
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name });
    const apiKey = version.payload?.data?.toString();

    if (apiKey) {
      process.env.GOOGLE_API_KEY = apiKey;
      dbLogger.info('Successfully loaded GOOGLE_API_KEY from Secret Manager.');
    } else {
      dbLogger.warn(`Secret payload for '${secretName}' was empty.`);
    }
  } catch (error) {
    dbLogger.error('Failed to load API key from Secret Manager. Ensure the secret exists and the service account has "Secret Manager Secret Accessor" role.', { 
        error: String(error),
        secretName,
        projectId
    });
    // Don't re-throw, allow app to continue (it might not need GenAI for all requests)
  }
}
