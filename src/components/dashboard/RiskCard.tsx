import React from 'react';
import { 
  AlertTriangle, 
  Copy, 
  Network, 
  FileCode, 
  GitFork, 
  Sliders, 
  ArrowUpRight 
} from 'lucide-react';
import { RiskCategory, CategoryKey } from '../../types/index.ts';

interface RiskCardProps {
  category: RiskCategory;
  isSelected?: boolean;
  onSelect: (categoryKey: CategoryKey) => void;
}

export const RiskCard: React.FC<RiskCardProps> = ({
  category,
  isSelected,
  onSelect
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'AlertTriangle':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Copy':
        return <Copy className="h-4 w-4" />;
      case 'Network':
        return <Network className="h-4 w-4" />;
      case 'FileCode':
        return <FileCode className="h-4 w-4" />;
      case 'GitFork':
        return <GitFork className="h-4 w-4" />;
      case 'Sliders':
        return <Sliders className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const severityStyles = {
    high: {
      badge: 'text-red-400 bg-red-500/10 border-red-500/20',
      bar: 'bg-red-500',
      iconText: 'text-red-400',
      label: 'High'
    },
    medium: {
      badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      bar: 'bg-amber-500',
      iconText: 'text-amber-400',
      label: 'Medium'
    },
    low: {
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      bar: 'bg-emerald-500',
      iconText: 'text-emerald-400',
      label: 'Low'
    }
  };

  const style = severityStyles[category.severity];
  const percentage = Math.round((category.score / category.maxScore) * 100);

  return (
    <button
      onClick={() => onSelect(category.key)}
      className={`group relative text-left w-full rounded-xl border p-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
        isSelected
          ? 'border-neutral-500 bg-neutral-900/90 shadow-md ring-1 ring-neutral-500/40'
          : 'border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/70'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg bg-neutral-800/60 ${style.iconText}`}>
            {getIcon(category.icon)}
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-neutral-200 transition-colors">
            {category.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${style.badge}`}>
            {style.label}
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
          {category.score} <span className="text-xs font-normal text-neutral-500 font-mono">/ {category.maxScore}</span>
        </div>
        <div className="text-xs text-neutral-400 font-medium">
          {category.findingsCount} {category.findingsCount === 1 ? 'finding' : 'findings'}
        </div>
      </div>

      {/* Progress Track */}
      <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out ${style.bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
        {category.explanation}
      </p>
    </button>
  );
};
