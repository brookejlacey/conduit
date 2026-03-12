'use client';

import { useMemo, useState } from 'react';

interface YieldChartProps {
  yieldAccrued: number; // USX lamports
}

const USX_DECIMALS = 6;
const CHART_WIDTH = 720;
const CHART_HEIGHT = 200;
const PADDING = { top: 20, right: 20, bottom: 30, left: 60 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;
const NUM_POINTS = 30;

function formatUsxShort(lamports: number): string {
  const amount = lamports / 10 ** USX_DECIMALS;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
}

function generateMockData(yieldAccrued: number): { day: number; label: string; value: number }[] {
  const points: { day: number; label: string; value: number }[] = [];
  const now = new Date();

  // Use a seeded-style approach with deterministic variance based on yieldAccrued
  // so the chart is stable across re-renders
  const seed = yieldAccrued % 10000;

  for (let i = 0; i < NUM_POINTS; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (NUM_POINTS - 1 - i));

    const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;

    // Base growth curve: exponential-ish ramp to current value
    const progress = (i + 1) / NUM_POINTS;
    const baseValue = yieldAccrued * (progress * progress * 0.7 + progress * 0.3);

    // Add deterministic variance (pseudo-random using sine)
    const variance = Math.sin(seed + i * 3.7) * 0.08 * baseValue;
    const value = Math.max(0, Math.round(baseValue + variance));

    points.push({ day: i, label: dayLabel, value });
  }

  // Ensure the last point matches the actual yield
  if (points.length > 0) {
    points[points.length - 1].value = yieldAccrued;
  }

  return points;
}

export default function YieldChart({ yieldAccrued }: YieldChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = useMemo(() => generateMockData(yieldAccrued), [yieldAccrued]);

  const maxValue = useMemo(() => {
    const max = Math.max(...data.map((d) => d.value));
    return max > 0 ? max * 1.1 : 1; // 10% headroom
  }, [data]);

  // Map data to SVG coordinates
  const points = useMemo(() => {
    return data.map((d, i) => ({
      x: PADDING.left + (i / (NUM_POINTS - 1)) * PLOT_WIDTH,
      y: PADDING.top + PLOT_HEIGHT - (d.value / maxValue) * PLOT_HEIGHT,
      ...d,
    }));
  }, [data, maxValue]);

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Area fill path: line + close along bottom
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const linePart = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const bottomRight = `L${points[points.length - 1].x},${PADDING.top + PLOT_HEIGHT}`;
    const bottomLeft = `L${points[0].x},${PADDING.top + PLOT_HEIGHT}`;
    return `${linePart} ${bottomRight} ${bottomLeft} Z`;
  }, [points]);

  // Y-axis ticks (5 ticks)
  const yTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= 4; i++) {
      const value = (maxValue / 4) * i;
      const y = PADDING.top + PLOT_HEIGHT - (i / 4) * PLOT_HEIGHT;
      ticks.push({ value, y });
    }
    return ticks;
  }, [maxValue]);

  // X-axis labels (every 5th day)
  const xLabels = useMemo(() => {
    return points.filter((_, i) => i % 5 === 0 || i === NUM_POINTS - 1);
  }, [points]);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={PADDING.left}
            y1={tick.y}
            x2={PADDING.left + PLOT_WIDTH}
            y2={tick.y}
            stroke="#2b396e"
            strokeWidth="1"
            strokeDasharray={i === 0 ? 'none' : '4 4'}
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#yieldGradient)" />

        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={PADDING.left - 8}
            y={tick.y + 4}
            textAnchor="end"
            className="fill-conduit-navy-400"
            fontSize="10"
            fontFamily="inherit"
          >
            {formatUsxShort(tick.value)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={PADDING.top + PLOT_HEIGHT + 18}
            textAnchor="middle"
            className="fill-conduit-navy-400"
            fontSize="10"
            fontFamily="inherit"
          >
            {p.label}
          </text>
        ))}

        {/* Hover hit areas */}
        {points.map((p, i) => (
          <rect
            key={i}
            x={p.x - PLOT_WIDTH / NUM_POINTS / 2}
            y={PADDING.top}
            width={PLOT_WIDTH / NUM_POINTS}
            height={PLOT_HEIGHT}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}

        {/* Hover indicator */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <>
            <line
              x1={points[hoveredIndex].x}
              y1={PADDING.top}
              x2={points[hoveredIndex].x}
              y2={PADDING.top + PLOT_HEIGHT}
              stroke="#34d399"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
            <circle
              cx={points[hoveredIndex].x}
              cy={points[hoveredIndex].y}
              r="4"
              fill="#34d399"
              stroke="#233064"
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="pointer-events-none absolute rounded border border-conduit-navy-700 bg-conduit-navy-900 px-3 py-2 shadow-lg"
          style={{
            left: `${(points[hoveredIndex].x / CHART_WIDTH) * 100}%`,
            top: `${(points[hoveredIndex].y / CHART_HEIGHT) * 100}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <p className="text-xs text-conduit-navy-400">{data[hoveredIndex].label}</p>
          <p className="text-sm font-semibold text-conduit-emerald-400">
            {formatUsxShort(data[hoveredIndex].value)}
          </p>
        </div>
      )}
    </div>
  );
}
