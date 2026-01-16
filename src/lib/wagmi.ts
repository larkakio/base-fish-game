/// <reference types="vite/client" />
import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect Project ID (get one at https://cloud.walletconnect.com)
const projectId = 'YOUR_PROJECT_ID';

// Base Mainnet only configuration
export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'Fishdom',
        description: 'Match-3 puzzle game on Base',
        url: 'https://fishdom.base.app',
        icons: ['https://fishdom.base.app/icon.png'],
      },
    }),
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
