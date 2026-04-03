import { Attribution } from "ox/erc8021";
import { base, baseSepolia } from "viem/chains";
import type { Chain } from "viem/chains";

const raw = import.meta.env.VITE_CHAIN_ID ?? "8453";
const parsed = Number(raw);

export const targetChainId: 8453 | 84532 =
  parsed === 84532 ? 84532 : 8453;

export function getTargetChain(): Chain {
  return targetChainId === 84532 ? baseSepolia : base;
}

export function getCheckInContractAddress(): `0x${string}` | undefined {
  const a = import.meta.env.VITE_CHECK_IN_CONTRACT_ADDRESS;
  if (!a || !a.startsWith("0x")) return undefined;
  return a as `0x${string}`;
}

export function getBuilderDataSuffix(): `0x${string}` {
  const override = import.meta.env.VITE_BUILDER_CODE_SUFFIX;
  if (override?.startsWith("0x")) {
    return override as `0x${string}`;
  }
  const code = import.meta.env.VITE_BUILDER_CODE;
  if (!code) {
    throw new Error(
      "Set VITE_BUILDER_CODE or VITE_BUILDER_CODE_SUFFIX",
    );
  }
  return Attribution.toDataSuffix({ codes: [code] });
}
