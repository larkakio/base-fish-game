"use client";

import { useConnect } from "wagmi";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WalletModal({ open, onClose }: Props) {
  const { connectors, connect, isPending } = useConnect();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-cyan-500/30 bg-[#0f1435] p-4 shadow-xl shadow-cyan-500/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="wallet-modal-title" className="font-orbitron text-lg text-cyan-300">
            Connect wallet
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {connectors.map((connector) => (
            <li key={connector.uid}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  connect({ connector }, { onSuccess: () => onClose() });
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:bg-white/10 disabled:opacity-40"
              >
                {connector.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
