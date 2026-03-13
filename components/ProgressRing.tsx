interface ProgressRingProps {
  completed: number;
  total: number;
}

export default function ProgressRing({ completed, total }: ProgressRingProps) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--card-border)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--success)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{completed}</span>
          <span className="text-sm text-[var(--muted)]">of {total}</span>
        </div>
      </div>
      <p className="text-sm text-[var(--muted)]">bridges walked</p>
    </div>
  );
}
