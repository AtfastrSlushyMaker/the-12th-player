import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { ModelInfo } from '@/lib/api';
import { useAppStore } from '@/store/appStore';

interface ExpertPanelProps {
  title: string;
  info?: ModelInfo | null;
  loading?: boolean;
  children?: React.ReactNode;
}

export function ExpertPanel({ title, info, loading, children }: ExpertPanelProps) {
  const [open, setOpen] = useState(false);
  const { expertMode } = useAppStore();
  if (!expertMode) return null;
  return (
    <div className="mt-8 panel-light backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-sm tracking-wide stat-green">
          <Info className="w-4 h-4" /> {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 text-sm space-y-4 animate-fade-in">
          {loading && <div className="text-muted-green text-xs">Loading model details...</div>}
          {info && (
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-green">Algorithm</div>
                  <div className="font-medium">{info.algorithm}</div>
                </div>
                {info.version && (
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-muted-green">Version</div>
                    <div className="font-medium">{info.version}</div>
                  </div>
                )}
                {info.num_clusters && (
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-muted-green">Clusters</div>
                    <div className="font-medium">{info.num_clusters}</div>
                  </div>
                )}
              </div>
              {info.features && info.features.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-green mb-1">Core Features</div>
                  <div className="flex flex-wrap gap-2">
                    {info.features.map(f => (
                      <span key={f} className="px-2 py-1 rounded-md bg-[#e9f9ec] text-[#0b6623] text-xs border border-[#0b6623]/15">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              {info.performance && Object.keys(info.performance).length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-green mb-1">Performance</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(info.performance).map(([k,v]) => (
                      <div key={k} className="p-2 rounded-lg bg-[#e9f9ec] border border-[#0b6623]/10">
                        <div className="text-[10px] uppercase tracking-wide text-muted-green">{k}</div>
                        <div className="font-semibold">{String(v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {info.cluster_labels && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-green mb-1">Cluster Labels</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(info.cluster_labels).map(([id,label]) => (
                      <span key={id} className="px-2 py-1 rounded-md bg-[#e9f9ec] text-[#0b6623] text-xs border border-[#0b6623]/15">{id}: {label}</span>
                    ))}
                  </div>
                </div>
              )}
              {info.limitations && info.limitations.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-green mb-1">Limitations</div>
                  <ul className="list-disc ml-5 space-y-1 text-xs text-muted-green">
                    {info.limitations.map(l => <li key={l}>{l}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

export default ExpertPanel;