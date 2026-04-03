/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAIN_ID?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_CHECK_IN_CONTRACT_ADDRESS?: string;
  readonly VITE_BUILDER_CODE?: string;
  readonly VITE_BUILDER_CODE_SUFFIX?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "@fish-wagmi/baseAccount" {
  export { baseAccount } from "@wagmi/connectors";
}

declare module "@fish-wagmi/walletConnect" {
  export { walletConnect } from "@wagmi/connectors";
}
