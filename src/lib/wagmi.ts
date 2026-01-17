/// <reference types="vite/client" />
import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Base Mainnet only configuration
export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
  ],
  transports: {
    [base.id]: http(),
  },
});

// Export Base chain for network switching
export { base };
export const REQUIRED_CHAIN_ID = base.id; // 8453

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
