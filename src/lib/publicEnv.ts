import { Attribution } from "ox/erc8021";
import { base, baseSepolia } from "viem/chains";
import type { Chain } from "viem/chains";

/** Base mainnet DailyCheckIn — matches `deployments/base-mainnet.json` */
const DEFAULT_CHECK_IN_CONTRACT =
  "0x514Dae070E72FbbC13Dc6Df3A66591489252c262" as const;

/** Default builder code when env is missing (e.g. Vercel var typo) */
const DEFAULT_BUILDER_CODE = "bc_uhxac39c";

const raw = import.meta.env.VITE_CHAIN_ID ?? "8453";
const parsed = Number(raw);

export const targetChainId: 8453 | 84532 =
  parsed === 84532 ? 84532 : 8453;

export function getTargetChain(): Chain {
  return targetChainId === 84532 ? baseSepolia : base;
}

export function getCheckInContractAddress(): `0x${string}` {
  const a = import.meta.env.VITE_CHECK_IN_CONTRACT_ADDRESS;
  if (a?.startsWith("0x")) return a as `0x${string}`;
  return DEFAULT_CHECK_IN_CONTRACT;
}

export function getBuilderDataSuffix(): `0x${string}` {
  const override = import.meta.env.VITE_BUILDER_CODE_SUFFIX;
  if (override?.startsWith("0x")) {
    return override as `0x${string}`;
  }
  const code =
    import.meta.env.VITE_BUILDER_CODE?.trim() || DEFAULT_BUILDER_CODE;
  return Attribution.toDataSuffix({ codes: [code] });
}
