import React from 'react';
import { ShieldCheck, CheckCircle2, Wrench, Sparkles, TrendingUp } from 'lucide-react';
import { InspectionData } from '../types';

interface InspectionCardProps {
  inspection: InspectionData | null;
  vin: string;
}

export const InspectionCard: React.FC<InspectionCardProps> = ({ inspection, vin }) => {
  if (!inspection) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        <ShieldCheck className="w-8 h-8 mx-auto text-amber-500/50 mb-2" />
        <h4 className="text-sm font-bold text-slate-200">Vehicle Inspection Report</h4>
        <p className="text-xs text-slate-500 mt-1">
          Inspection analysis in progress by the automated Vehicle Inspection Microservice for VIN {vin}.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 80) return 'text-blue-400 border-blue-500/40 bg-blue-500/10';
    if (score >= 70) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-red-400 border-red-500/40 bg-red-500/10';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Verified Inspection & Valuation Report
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Microservice Verified
              </span>
            </h3>
            <p className="text-xs text-slate-400">VIN: <span className="font-mono text-slate-300">{vin}</span></p>
          </div>
        </div>

        {/* Estimated Market Valuation */}
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 justify-end">
            <TrendingUp className="w-3 h-3 text-amber-400" /> Algorithmic Valuation
          </span>
          <div className="text-sm font-black text-amber-400">
            ${Number(inspection.estimated_low_valuation).toLocaleString()} – ${Number(inspection.estimated_high_valuation).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Scores Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${getScoreColor(inspection.overall_condition_score)}`}>
          <span className="text-2xl font-black">{inspection.overall_condition_score}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider mt-1 text-slate-300">Overall Score</span>
        </div>
        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${getScoreColor(inspection.mechanical_score)}`}>
          <div className="flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5" />
            <span className="text-2xl font-black">{inspection.mechanical_score}</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider mt-1 text-slate-300">Mechanical</span>
        </div>
        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${getScoreColor(inspection.cosmetic_score)}`}>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-2xl font-black">{inspection.cosmetic_score}</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider mt-1 text-slate-300">Cosmetic</span>
        </div>
      </div>

      {/* Inspection Checklist */}
      {inspection.inspection_report && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pre-Purchase Telemetry Checklist</h4>
          <div className="grid sm:grid-cols-2 gap-2 text-xs">
            {Object.entries(inspection.inspection_report).map(([key, val]) => (
              <div key={key} className="p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/60 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-slate-400 font-medium capitalize block text-[11px]">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-200 font-bold truncate block">
                    {Array.isArray(val) ? val.join(', ') : String(val)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
