/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_RELEASE_TAG?: string;
  readonly VITE_GIT_COMMIT?: string;
  readonly VITE_ENV?: string;
  readonly VITE_AUCTION_SERVICE_URL?: string;
  readonly VITE_NOTIFICATION_SERVICE_URL?: string;
  readonly VITE_INSPECTION_SERVICE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
