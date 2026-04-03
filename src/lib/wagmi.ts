/// <reference types="vite/client" />
import { http, createConfig } from "wagmi";
import { mainnet } from "viem/chains";
import { baseAccount, injected, walletConnect } from "wagmi/connectors";

import { getTargetChain } from "@/lib/publicEnv";

const target = getTargetChain();
const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [target, mainnet],
  connectors: [
    injected(),
    baseAccount({
      appName: "Base Fish",
    }),
    ...(wcProjectId
      ? [
          walletConnect({
            projectId: wcProjectId,
            showQrModal: true,
          }),
        ]
      : []),
  ],
  transports: {
    [target.id]: http(),
    [mainnet.id]: http(),
  },
});

export { target as targetChain };
export const REQUIRED_CHAIN_ID = target.id;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
