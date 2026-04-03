"use client";

import { useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

import { checkInAbi } from "@/lib/checkInAbi";
import {
  getBuilderDataSuffix,
  getCheckInContractAddress,
  getTargetChain,
} from "@/lib/publicEnv";

import { WalletModal } from "./WalletModal";

export function DailyCheckIn() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const [walletOpen, setWalletOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const target = getTargetChain();
  const contract = getCheckInContractAddress();

  const { data: streak } = useReadContract({
    address: contract,
    abi: checkInAbi,
    functionName: "streak",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(contract && address) },
  });

  async function handleCheckIn() {
    setErr(null);
    if (!contract) {
      setErr("Check-in is not configured.");
      return;
    }
    if (!isConnected || !address) {
      setWalletOpen(true);
      return;
    }
    try {
      if (chainId !== target.id) {
        await switchChainAsync({ chainId: target.id });
      }
      const dataSuffix = getBuilderDataSuffix();
      await writeContractAsync({
        address: contract,
        abi: checkInAbi,
        functionName: "checkIn",
        chainId: target.id,
        dataSuffix,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      setErr(msg);
    }
  }

  const busy = isWriting;

  return (
    <>
      <div className="pointer-events-auto fixed bottom-4 left-4 right-4 z-[80] flex max-w-md flex-col gap-2 sm:left-auto sm:right-4 sm:w-80">
        {err ? (
          <p className="rounded-lg bg-red-950/90 px-3 py-2 text-xs text-red-200">{err}</p>
        ) : null}
        <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/40 bg-[#0a0e27]/95 px-3 py-2 shadow-lg backdrop-blur">
          <div className="min-w-0 flex-1">
            <p className="font-orbitron text-xs text-cyan-400">Daily check-in</p>
            {address ? (
              <p className="truncate text-[11px] text-slate-400">
                {address.slice(0, 6)}…{address.slice(-4)}
                {streak != null ? ` · streak ${String(streak)}` : null}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">Connect to record on Base</p>
            )}
          </div>
          {!isConnected ? (
            <button
              type="button"
              onClick={() => setWalletOpen(true)}
              className="shrink-0 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-[#0a0e27]"
            >
              Connect
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || !contract}
              onClick={() => void handleCheckIn()}
              className="shrink-0 rounded-xl bg-magenta-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: "#e879f9" }}
            >
              {busy ? "…" : "Check in"}
            </button>
          )}
        </div>
      </div>
      <WalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
    </>
  );
}
