/// <reference types="vite/client" />
import { http, createConfig, createConnector } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import sdk from '@farcaster/frame-sdk';

// Create a custom connector for Farcaster SDK
const farcasterConnector = () => {
  return createConnector((config) => ({
    id: 'farcaster',
    name: 'Farcaster',
    type: 'farcaster',
    
    async connect() {
      const provider = await this.getProvider();
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      }) as string[];
      
      const chainId = await this.getChainId();
      
      return {
        accounts,
        chainId,
      };
    },
    
    async disconnect() {
      // Farcaster doesn't support disconnect
    },
    
    async getAccounts() {
      const provider = await this.getProvider();
      const accounts = await provider.request({
        method: 'eth_accounts',
      }) as string[];
      return accounts;
    },
    
    async getChainId() {
      const provider = await this.getProvider();
      const chainId = await provider.request({
        method: 'eth_chainId',
      }) as string;
      return parseInt(chainId, 16);
    },
    
    async getProvider() {
      if (!sdk.wallet?.ethProvider) {
        throw new Error('Farcaster wallet not available');
      }
      return sdk.wallet.ethProvider;
    },
    
    async isAuthorized() {
      try {
        const accounts = await this.getAccounts();
        return accounts.length > 0;
      } catch {
        return false;
      }
    },
    
    onAccountsChanged(accounts: string[]) {
      config.emitter.emit('change', { accounts });
    },
    
    onChainChanged(chainId: string) {
      config.emitter.emit('change', { chainId: parseInt(chainId, 16) });
    },
    
    onDisconnect() {
      config.emitter.emit('disconnect');
    },
  }));
};

// Base Mainnet only configuration
export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    farcasterConnector(),
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
