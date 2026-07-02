'use client';

interface PreciseSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}

export function PreciseSlider({
  label,
  value,
  min = -100,
  max = 100,
  step = 1,
  onChange,
  unit,
}: PreciseSliderProps) {
  function clamp(n: number) {
    return Math.min(max, Math.max(min, n));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">{label}</span>
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            if (!Number.isNaN(parsed)) onChange(clamp(parsed));
          }}
          className="w-12 rounded border border-neutral-800 bg-neutral-900 text-center font-mono text-[11px] text-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
        {unit && <span className="font-mono text-[10px] text-neutral-600">{unit}</span>}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 accent-amber-500/90 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400/90"
      />
    </div>
  );
}
