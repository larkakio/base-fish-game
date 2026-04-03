"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";

import { getTargetChain } from "@/lib/publicEnv";

export function WrongNetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending } = useSwitchChain();
  const target = getTargetChain();

  if (!isConnected || chainId === target.id) return null;

  return (
    <div className="pointer-events-auto fixed left-0 right-0 top-0 z-[90] flex items-center justify-center gap-3 bg-amber-600/95 px-3 py-2 text-center text-sm text-amber-950">
      <span>Wrong network — switch to {target.name} to play and check in.</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => switchChainAsync({ chainId: target.id })}
        className="rounded-md bg-amber-950 px-3 py-1 text-amber-100 disabled:opacity-50"
      >
        {isPending ? "…" : `Use ${target.name}`}
      </button>
    </div>
  );
}
