"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DirectCallLoadingState({ label }: { label: string }) {
  return (
    <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-lg font-semibold">{label}</p>
      </div>
    </main>
  );
}

export function DirectCallErrorState({ message }: { message: string }) {
  const router = useRouter();

  return (
    <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
      <div className="max-w-md rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
        <p className="text-2xl font-semibold">Call unavailable</p>
        <p className="mt-3 text-sm leading-6 text-[#aab4d1]">{message}</p>
        <button
          type="button"
          onClick={() => router.replace("/chat")}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#2d6bff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5cf2]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to messages
        </button>
      </div>
    </main>
  );
}
