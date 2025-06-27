# Persona Recruit AI

This is a NextJS starter for Persona Recruit AI, an intelligent platform to accelerate recruitment using AI.

To get started, take a look at src/app/page.tsx.

## Configuration

To run this project, you need to set up your environment variables.

1. Copy `.env.example` to a new file named `.env.local`.
2. Fill in the required values in `.env.local`.

### Gemini API Key Setup

The application uses Google's Gemini models via Genkit. The API key can be configured in two ways:

1.  **Production (Recommended):** Store your Gemini API key in Google Secret Manager.
    - Set `GEMINI_API_KEY_SECRET` in your environment to the name of your secret.
    - Set `GOOGLE_CLOUD_PROJECT` to your Google Cloud project ID.
    - Ensure the service account running the application has the "Secret Manager Secret Accessor" IAM role.

2.  **Local Development:** Set the `GOOGLE_API_KEY` variable directly in your `.env.local` file. This will bypass Secret Manager.

The application will automatically use the key from Secret Manager if `GEMINI_API_KEY_SECRET` is set and `GOOGLE_API_KEY` is not.
