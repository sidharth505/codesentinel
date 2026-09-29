import React, { useState } from 'react';
import { 
  Network, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  ArrowRight, 
  Info, 
  Zap,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { ArchitectureNode, ArchitectureEdge } from '../../types/index.ts';

interface ArchitectureGraphProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  onSelectFinding?: (findingId: string) => void;
}

export const ArchitectureGraph: React.FC<ArchitectureGraphProps> = ({
  nodes,
  edges,
  onSelectFinding
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterCoupledOnly, setFilterCoupledOnly] = useState<boolean>(false);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  if (nodes.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-400">No module dependency data was found in this analysis.</p>;
  }

  const getNodeColor = (type: ArchitectureNode['type'], coupling: ArchitectureNode['couplingLevel']) => {
    if (coupling === 'high') {
      return {
        border: 'border-red-500/70',
        bg: 'bg-red-950/30',
        text: 'text-red-400',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.25)]',
        badge: 'bg-red-500/10 text-red-400 border-red-500/30'
      };
    }
    if (coupling === 'medium') {
      return {
        border: 'border-amber-500/60',
        bg: 'bg-amber-950/20',
        text: 'text-amber-400',
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      };
    }
    return {
      border: 'border-neutral-700',
      bg: 'bg-neutral-900',
      text: 'text-neutral-300',
      glow: '',
      badge: 'bg-neutral-800 text-neutral-400 border-neutral-700'
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Architecture Overview
            </h2>
            <span className="text-xs font-mono text-neutral-500">· Modular Coupling Graph</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Visual map of service dependencies and circular import clusters detected across Python modules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterCoupledOnly(!filterCoupledOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              filterCoupledOnly
                ? 'bg-red-500/10 border-red-500/40 text-red-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{filterCoupledOnly ? 'Showing High-Risk Only' : 'Highlight High Risk'}</span>
          </button>
        </div>
      </div>

      {/* Main Graph Grid with Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graph Canvas Card */}
        <div className="lg:col-span-8 rounded-2xl border border-neutral-800 bg-[#080a10] p-4 sm:p-6 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
          {/* Subtle Grid Lines Pattern */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #383e58 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Top Canvas Legend */}
          <div className="relative z-10 flex items-center justify-between gap-2 pb-4 border-b border-neutral-800/60 text-xs">
            <div className="flex items-center gap-4 text-neutral-400 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                <span>High Coupling (Risk)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Medium Coupling</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-neutral-500" />
                <span>Standard Boundary</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-neutral-500">
              Interactive · Click any node to inspect
            </div>
          </div>

          {/* SVG Dependency Canvas */}
          <div className="relative z-10 w-full my-auto py-6 overflow-x-auto">
            <svg viewBox="0 0 820 400" className="w-full h-auto min-w-[700px] select-none">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#52525b" />
                </marker>
                <marker
                  id="arrow-red"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#ef4444" />
                </marker>
              </defs>

              {/* Render Connecting Edges */}
              {edges.map((edge) => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const isCoupled = edge.isCoupledHigh;
                const isSelectedEdge = selectedNodeId === edge.source || selectedNodeId === edge.target;

                // Simple curved spline calculation
                const sx = sourceNode.x + 60;
                const sy = sourceNode.y + 20;
                const tx = targetNode.x - 60;
                const ty = targetNode.y + 20;
                const midX = (sx + tx) / 2;

                return (
                  <g key={edge.id}>
                    <path
                      d={`M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`}
                      fill="none"
                      stroke={isCoupled ? '#ef4444' : isSelectedEdge ? '#a1a1aa' : '#3f3f46'}
                      strokeWidth={isCoupled ? 2.5 : 1.5}
                      strokeDasharray={isCoupled ? '4 3' : undefined}
                      markerEnd={isCoupled ? 'url(#arrow-red)' : 'url(#arrow)'}
                      className="transition-all duration-300"
                    />
                    {isCoupled && (
                      <circle
                        cx={midX}
                        cy={(sy + ty) / 2}
                        r="3"
                        fill="#ef4444"
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              })}

              {/* Render Node Boxes */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const color = getNodeColor(node.type, node.couplingLevel);
                const isFaded = filterCoupledOnly && node.couplingLevel === 'low';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x - 70}, ${node.y - 25})`}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`cursor-pointer transition-opacity duration-200 ${isFaded ? 'opacity-30' : 'opacity-100'}`}
                  >
                    {/* Node Background Rect */}
                    <rect
                      width="140"
                      height="64"
                      rx="10"
                      className={`transition-all duration-200 ${
                        isSelected
                          ? 'fill-[#121622] stroke-white stroke-2'
                          : `${color.bg} ${color.border} stroke-1`
                      } ${color.glow}`}
                      fill="#0d111d"
                      stroke={isSelected ? '#ffffff' : undefined}
                    />

                    {/* Node Label Text */}
                    <text
                      x="70"
                      y="26"
                      textAnchor="middle"
                      className="text-[12px] font-bold fill-white tracking-tight"
                      fontFamily="var(--font-sans)"
                    >
                      {node.name}
                    </text>

                    {/* Role / Subtitle */}
                    <text
                      x="70"
                      y="42"
                      textAnchor="middle"
                      className="text-[10px] fill-neutral-400 font-mono"
                      fontFamily="var(--font-mono)"
                    >
                      {node.role}
                    </text>

                    {/* Coupling Indicator Dot */}
                    {node.couplingLevel === 'high' && (
                      <circle
                        cx="130"
                        cy="12"
                        r="4"
                        fill="#ef4444"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom helper footnote */}
          <div className="relative z-10 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Red dashed lines indicate mutual cyclic coupling detected in AST imports.</span>
              <span className="font-mono text-neutral-500">{nodes.length} modules · {edges.length} imports</span>
          </div>
        </div>

        {/* Side Panel: Architecture Risk & Node Inspector */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4" />
              <span>Dependency Summary</span>
            </div>

            <h3 className="text-base font-bold text-white leading-snug">
              {nodes.filter((node) => node.couplingLevel === 'high').length} modules have high coupling.
            </h3>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {edges.filter((edge) => edge.isCoupledHigh).length} mutual import relationships were identified in the analyzed modules.
            </p>

            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-400">Highest instability index:</span>
              <span className="font-mono font-bold text-neutral-200">{Math.max(...nodes.map((node) => node.instabilityIndex)).toFixed(2)}</span>
            </div>
          </div>

          {/* Selected Node Inspector Card */}
          {selectedNode && <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                  Inspecting Module
                </span>
                <h4 className="text-base font-bold text-white">
                  {selectedNode.name}
                </h4>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                selectedNode.couplingLevel === 'high'
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : selectedNode.couplingLevel === 'medium'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : 'border-neutral-700 bg-neutral-800 text-neutral-300'
              }`}>
                {selectedNode.couplingLevel.toUpperCase()} COUPLING
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {selectedNode.description}
            </p>

            {/* Coupling Statistics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-lg bg-neutral-950 p-2.5 border border-neutral-800/80">
                <div className="text-neutral-500 text-[10px]">Afferent (Incoming)</div>
                <div className="text-base font-bold text-white">{selectedNode.incomingCoupling} modules</div>
              </div>
              <div className="rounded-lg bg-neutral-950 p-2.5 border border-neutral-800/80">
                <div className="text-neutral-500 text-[10px]">Efferent (Outgoing)</div>
                <div className="text-base font-bold text-white">{selectedNode.outgoingCoupling} modules</div>
              </div>
            </div>

            {/* Findings related to this module */}
            {selectedNode.relatedFindings.length > 0 && (
              <div className="pt-2 border-t border-neutral-800/80">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-2">
                  <span>Linked Findings</span>
                  <span className="text-red-400 font-bold">{selectedNode.relatedFindings.length}</span>
                </div>
                <div className="space-y-1.5">
                  {selectedNode.relatedFindings.map(fid => (
                    <button
                      key={fid}
                      onClick={() => onSelectFinding && onSelectFinding(fid)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs font-mono text-neutral-300 hover:border-neutral-700 hover:text-white flex items-center justify-between transition-colors"
                    >
                      <span className="truncate">Finding: {fid}</span>
                      <ArrowRight className="h-3 w-3 text-neutral-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>}
        </div>
      </div>
    </div>
  );
};
