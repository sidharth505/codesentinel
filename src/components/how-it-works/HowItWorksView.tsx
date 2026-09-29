import React from 'react';
import { 
  Shield, 
  Terminal, 
  AlertTriangle, 
  Network, 
  FileCode, 
  Cpu,
  ArrowRight
} from 'lucide-react';

interface HowItWorksViewProps {
  onGoToDashboard: () => void;
  onGoToUpload: () => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({
  onGoToDashboard,
  onGoToUpload
}) => {
  const pillars = [
    {
      title: 'Silent Exception Suppression',
      description: 'Bare handlers and broad handlers with empty or non-raising bodies are reported. Review each result to determine whether errors are actually hidden.',
      icon: <AlertTriangle className="h-5 w-5 text-red-400" />
    },
    {
      title: 'Repeated Function Structure',
      description: 'Functions with matching top-level AST statement shapes are grouped for review. Matching shapes do not prove identical behavior.',
      icon: <FileCode className="h-5 w-5 text-amber-400" />
    },
    {
      title: 'Circular Module Coupling',
      description: 'Resolvable mutual imports between local Python modules are shown as cycles. Dynamic loading and third-party imports are outside this graph.',
      icon: <Network className="h-5 w-5 text-red-400" />
    },
    {
      title: 'Unreferenced Python Symbols',
      description: 'Definitions without direct call references in scanned Python files are flagged. Entry points, reflection, and external callers may not be recognized.',
      icon: <FileCode className="h-5 w-5 text-amber-400" />
    },
    {
      title: 'Missing HTTP Timeouts',
      description: 'Recognized HTTP-like client calls are flagged when they omit an explicit timeout keyword.',
      icon: <Cpu className="h-5 w-5 text-emerald-400" />
    },
    {
      title: 'Environment Variable Defaults',
      description: 'Environment lookups with inline defaults are reported when the source line contains a sensitive-looking name such as key, token, auth, or password.',
      icon: <Shield className="h-5 w-5 text-amber-400" />
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs font-mono text-neutral-300">
          <Terminal className="h-3.5 w-3.5 text-neutral-400" />
          <span>Analysis Rules</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Python Static Analysis
        </h1>

        <p className="text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
          Findings come from inspecting repository source with the current analyzer rules. They are review signals, not proof of exploitability.
        </p>
      </div>

      {/* Positioning Statement Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-md space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-400" />
          <span>Scope and limitations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-neutral-300 leading-relaxed">
          <div className="space-y-3">
            <p>
              The analyzer inspects Python files for exception handling, repeated function structure, local import cycles, unreferenced symbols, HTTP calls without explicit timeouts, and environment lookups with defaults.
            </p>
            <p>
              Static inspection cannot fully evaluate runtime behavior, dynamic imports, external callers, or deployed configuration.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
            <div className="text-neutral-400 font-mono text-[11px] uppercase tracking-wider">
              Important distinction
            </div>
            <p className="text-white font-medium">
              Findings describe source patterns; they do not establish authorship or confirm a vulnerability.
            </p>
            <p className="text-neutral-400">
              Inspect the cited source context and validate each result against the application's intended behavior.
            </p>
          </div>
        </div>
      </div>

      {/* 6 Architectural Dimensions */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Implemented checks
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            A check produces findings only when its corresponding source pattern is detected.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-3 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neutral-800">
                  {pillar.icon}
                </div>
                <h3 className="text-sm font-bold text-white">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">
            Ready to audit your codebase?
          </h3>
          <p className="text-xs text-neutral-400">
            Scan Python files from an uploaded archive or public GitHub repository.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGoToDashboard}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition-colors"
          >
            Explore Dashboard
          </button>
          <button
            onClick={onGoToUpload}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-white text-neutral-950 hover:bg-neutral-100 transition-colors shadow-sm"
          >
            <span>Analyze Codebase</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
