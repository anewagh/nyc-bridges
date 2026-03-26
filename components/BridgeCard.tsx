import Link from "next/link";
import { Bridge } from "@/lib/bridges";

interface BridgeCardProps {
  bridge: Bridge;
  completed: boolean;
  walkDate?: string;
}

export default function BridgeCard({ bridge, completed, walkDate }: BridgeCardProps) {
  return (
    <Link href={`/bridges/${bridge.slug}`}>
      <div
        className={`rounded-xl border p-4 transition-all duration-200 ${
          completed
            ? "border-[var(--success)] bg-[var(--card-bg)] shadow-sm hover:shadow-[0_4px_16px_rgba(194,112,62,0.12)]"
            : "border-[var(--card-border)] bg-[var(--card-bg)] opacity-70 hover:opacity-100 hover:shadow-[0_4px_16px_rgba(194,112,62,0.10)]"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{bridge.name}</h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              {bridge.from} &rarr; {bridge.to}
            </p>
          </div>
          <div className="flex-shrink-0">
            {completed ? (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--success)] text-white text-xs">
                &#10003;
              </span>
            ) : (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-[var(--card-border)]" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-[var(--muted)]">
          <span>{bridge.distance}</span>
          <span>Built {bridge.yearBuilt}</span>
          {completed && walkDate && (
            <span className="ml-auto text-[var(--success)] font-medium">
              {new Date(walkDate + "T12:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
