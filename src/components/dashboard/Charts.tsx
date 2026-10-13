import React from 'react';

/**
 * Donut Chart Slice Definition
 */
export interface DonutSlice {
  key: string;
  label_en: string;
  label_mr: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  totalLabel_en?: string;
  totalLabel_mr?: string;
  size?: number;
  innerRadiusRatio?: number;
  language?: 'en' | 'mr';
}

/**
 * Clean, lightweight SVG Donut Chart with center total and interactive legend
 */
export const DonutChart: React.FC<DonutChartProps> = ({
  slices,
  totalLabel_en = 'Total',
  totalLabel_mr = 'एकूण',
  size = 180,
  innerRadiusRatio = 0.65,
  language = 'en',
}) => {
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  // When total is 0, render empty state ring
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size / 2) * 0.8}
            stroke="#1B3F73"
            strokeWidth={16}
            fill="transparent"
          />
          <text
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-slate-400 font-sans"
          >
            {language === 'mr' ? 'डेटा नाही' : 'No Data'}
          </text>
        </svg>
      </div>
    );
  }

  const radius = (size / 2) * 0.85;
  const strokeWidth = radius * (1 - innerRadiusRatio);
  const adjustedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * adjustedRadius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 justify-around">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {slices.map((slice) => {
            if (slice.value === 0) return null;
            const percent = slice.value / total;
            const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
            const strokeDashoffset = -circumference * accumulatedPercent;
            accumulatedPercent += percent;

            return (
              <circle
                key={slice.key}
                cx={size / 2}
                cy={size / 2}
                r={adjustedRadius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out hover:opacity-80"
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-white font-mono">{total}</span>
          <span className="text-[10px] text-muted uppercase tracking-wider">
            {language === 'mr' ? totalLabel_mr : totalLabel_en}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-[130px] w-full sm:w-auto">
        {slices.map((slice) => {
          const percent = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          return (
            <div key={slice.key} className="flex items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-slate-300 font-medium">
                  {language === 'mr' ? slice.label_mr : slice.label_en}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-white font-bold">{slice.value}</span>
                <span className="text-[10px] text-muted">({percent}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Clean Horizontal Bar Chart Item Definition
 */
export interface BarItem {
  id: string;
  label_en: string;
  label_mr: string;
  value: number;
  subLabel?: string;
  color?: string;
}

interface BarChartHorizontalProps {
  items: BarItem[];
  language?: 'en' | 'mr';
  maxVal?: number;
  unit?: string;
  barColor?: string;
}

export const BarChartHorizontal: React.FC<BarChartHorizontalProps> = ({
  items,
  language = 'en',
  maxVal,
  unit = '',
  barColor = '#FF9933', // saffron
}) => {
  const highest = maxVal || Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted">
        {language === 'mr' ? 'डेटा उपलब्ध नाही' : 'No data available'}
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {items.map((item) => {
        const percent = Math.min(100, Math.round((item.value / highest) * 100));
        const color = item.color || barColor;

        return (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200 truncate pr-2" title={language === 'mr' ? item.label_mr : item.label_en}>
                {language === 'mr' ? item.label_mr : item.label_en}
              </span>
              <div className="flex items-center gap-1 shrink-0 font-mono">
                <span className="font-bold text-white">{item.value}</span>
                {unit && <span className="text-[10px] text-muted">{unit}</span>}
              </div>
            </div>
            {/* Bar Track & Fill */}
            <div className="h-2 w-full bg-navy-800 rounded-full overflow-hidden flex">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${percent}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            {item.subLabel && (
              <span className="text-[10px] text-muted block">{item.subLabel}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
