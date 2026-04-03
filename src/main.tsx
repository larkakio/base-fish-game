import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import { wagmiConfig } from './lib/wagmi';
import { DailyCheckIn } from '@/components/DailyCheckIn';
import { WrongNetworkBanner } from '@/components/WrongNetworkBanner';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WrongNetworkBanner />
        <App />
        <DailyCheckIn />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
