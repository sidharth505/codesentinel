import React from 'react';
import { 
  FileCode, 
  Code2, 
  Box, 
  GitFork, 
  Copy, 
  AlertTriangle,
  Maximize
} from 'lucide-react';
import { CodebaseMetrics as MetricsType } from '../../types/index.ts';

interface CodebaseMetricsProps {
  metrics: MetricsType;
}

export const CodebaseMetrics: React.FC<CodebaseMetricsProps> = ({ metrics }) => {
  const metricItems = [
    {
      label: 'Files analyzed',
      value: metrics.filesAnalyzed,
      subtext: 'Source files scanned',
      icon: <FileCode className="h-4 w-4 text-neutral-400" />,
      color: 'border-neutral-800'
    },
    {
      label: 'Functions',
      value: metrics.functions,
      subtext: 'Python function definitions',
      icon: <Code2 className="h-4 w-4 text-neutral-400" />,
      color: 'border-neutral-800'
    },
    {
      label: 'Classes',
      value: metrics.classes,
      subtext: 'Python class definitions',
      icon: <Box className="h-4 w-4 text-neutral-400" />,
      color: 'border-neutral-800'
    },
    {
      label: 'Dependencies',
      value: metrics.dependencies,
      subtext: 'Distinct imported modules',
      icon: <GitFork className="h-4 w-4 text-neutral-400" />,
      color: 'border-neutral-800'
    },
    {
      label: 'Duplicate clusters',
      value: metrics.duplicateClusters,
      subtext: 'Identical function body structures',
      icon: <Copy className="h-4 w-4 text-amber-400" />,
      color: metrics.duplicateClusters > 0 ? 'border-amber-500/20 bg-amber-500/5' : 'border-neutral-800'
    },
    {
      label: 'Exception handlers',
      value: metrics.exceptionHandlers,
      subtext: 'Try-except blocks inspected',
      icon: <AlertTriangle className="h-4 w-4 text-red-400" />,
      color: 'border-red-500/20 bg-red-500/5',
      badge: metrics.exceptionHandlers === 0 ? undefined : `${metrics.exceptionHandlers} found`
    },
    {
      label: 'Large functions',
      value: metrics.largeFunctions,
      subtext: 'Functions longer than 40 lines',
      icon: <Maximize className="h-4 w-4 text-amber-400" />,
      color: metrics.largeFunctions > 0 ? 'border-amber-500/20 bg-amber-500/5' : 'border-neutral-800'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Codebase Composition Metrics
          </h3>
          <p className="text-xs text-neutral-400">
            Structural topology derived from static AST inspection.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {metricItems.map((item, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-4 bg-neutral-900/50 flex flex-col justify-between transition-colors hover:border-neutral-700/80 ${item.color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-1.5 rounded-lg bg-neutral-800/80">
                {item.icon}
              </span>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-neutral-700/60 bg-neutral-800/80 text-neutral-300">
                  {item.badge}
                </span>
              )}
            </div>

            <div className="space-y-0.5 mt-2">
              <div className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
                {item.value.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-neutral-300">
                {item.label}
              </div>
              <div className="text-[11px] text-neutral-500 line-clamp-1">
                {item.subtext}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
