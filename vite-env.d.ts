/// <reference types="vite/client" />

interface ImportMetaEnv {
  // For local testing only (exposes key in browser - not secure for production)
  readonly VITE_GEMINI_API_KEY?: string;

  // For production: URL of your backend proxy that holds the API key securely
  readonly VITE_API_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
