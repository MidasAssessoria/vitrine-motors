import { useRef, useCallback } from 'react';

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  format?: (v: number) => string;
}

export function RangeSlider({
  label, min, max, step = 1,
  valueMin, valueMax,
  onChangeMin, onChangeMax,
  format = (v) => String(v),
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const pct = useCallback(
    (v: number) => ((v - min) / (max - min)) * 100,
    [min, max]
  );

  const leftPct = pct(valueMin);
  const rightPct = pct(valueMax);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-xs text-text-secondary">
          {format(valueMin)} — {format(valueMax)}
        </span>
      </div>

      <div className="relative h-5 flex items-center" ref={trackRef}>
        {/* Track background */}
        <div className="absolute w-full h-1.5 bg-border rounded-full" />

        {/* Active range */}
        <div
          className="absolute h-1.5 bg-primary rounded-full"
          style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={min} max={max} step={step}
          value={valueMin}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= valueMax) onChangeMin(v);
          }}
          className="range-thumb absolute w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: valueMin > max - (max - min) * 0.1 ? 5 : 3 }}
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min} max={max} step={step}
          value={valueMax}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= valueMin) onChangeMax(v);
          }}
          className="range-thumb absolute w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 4 }}
        />

        {/* Visible thumbs */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full shadow-sm pointer-events-none -translate-x-1/2"
          style={{ left: `${leftPct}%`, zIndex: 6 }}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full shadow-sm pointer-events-none -translate-x-1/2"
          style={{ left: `${rightPct}%`, zIndex: 6 }}
        />
      </div>
    </div>
  );
}
