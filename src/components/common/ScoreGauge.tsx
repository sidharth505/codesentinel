import React from 'react';
import { Severity } from '../../types/index.ts';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  severity?: Severity;
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  maxScore = 100,
  size = 140,
  strokeWidth = 10,
  severity = 'high',
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(score / maxScore, 0), 1);
  const strokeDashoffset = circumference - percentage * circumference;

  // Severity color mapping
  const severityColors = {
    high: {
      stroke: '#ef4444', // red-500
      glow: 'rgba(239, 68, 68, 0.25)',
      text: 'text-red-400',
      bgRing: 'stroke-neutral-800'
    },
    medium: {
      stroke: '#f59e0b', // amber-500
      glow: 'rgba(245, 158, 11, 0.25)',
      text: 'text-amber-400',
      bgRing: 'stroke-neutral-800'
    },
    low: {
      stroke: '#10b981', // emerald-500
      glow: 'rgba(16, 185, 129, 0.25)',
      text: 'text-emerald-400',
      bgRing: 'stroke-neutral-800'
    }
  };

  const currentTheme = severityColors[severity];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: `drop-shadow(0 0 12px ${currentTheme.glow})` }}
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={currentTheme.bgRing}
          fill="none"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={currentTheme.stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
            {score}
          </span>
          <span className="text-xs text-neutral-400 font-mono tracking-wider">
            /{maxScore}
          </span>
        </div>
      )}
    </div>
  );
};
