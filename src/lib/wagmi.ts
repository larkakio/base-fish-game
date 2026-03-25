/// <reference types="vite/client" />
import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    baseAccount({
      appName: "Base Fish",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

export { base };
export const REQUIRED_CHAIN_ID = base.id;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
