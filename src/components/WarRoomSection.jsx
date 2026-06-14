import React, { useEffect, useState } from 'react';
import { Target, AlertTriangle, Crosshair, TrendingUp, Activity, BookOpen } from 'lucide-react';
import { getWarRoomStats } from '../lib/db';

const RadarChart = ({ data }) => {
  // Simple SVG Radar Chart
  const size = 200;
  const center = size / 2;
  const radius = (size / 2) - 20;
  
  if (!data || data.length === 0) {
    return <div className="h-[200px] flex items-center justify-center text-theme-muted">No Data Yet</div>;
  }

  // Ensure we have exactly 6 points for a hexagon
  const maxPoints = 6;
  const displayData = [...data].sort((a, b) => b.wmi - a.wmi).slice(0, maxPoints);
  while (displayData.length < maxPoints && displayData.length > 0) {
    displayData.push({ categoryId: 'N/A', wmi: 0 });
  }

  const getCoordinatesForAngle = (angle, value) => {
    const angleRad = (angle - 90) * (Math.PI / 180);
    return {
      x: center + (radius * value * Math.cos(angleRad)),
      y: center + (radius * value * Math.sin(angleRad))
    };
  };

  const angleStep = 360 / maxPoints;

  // Background Grid (3 levels)
  const gridLevels = [0.33, 0.66, 1];
  
  // Data Polygon
  const dataPoints = displayData.map((d, i) => getCoordinatesForAngle(i * angleStep, Math.max(0, d.wmi) / 100));
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="relative flex justify-center items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grids */}
        {gridLevels.map((level, i) => {
          const pts = Array.from({ length: maxPoints }).map((_, idx) => {
            const p = getCoordinatesForAngle(idx * angleStep, level);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={i} points={pts} fill="none" stroke="rgba(128, 128, 128, 0.15)" strokeWidth="1" />
        })}
        
        {/* Axes */}
        {Array.from({ length: maxPoints }).map((_, i) => {
          const p = getCoordinatesForAngle(i * angleStep, 1);
          return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(128, 128, 128, 0.15)" strokeWidth="1" />
        })}

        {/* Data Area */}
        <polygon points={polygonPoints} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="2" className="animate-subtle" />
        
        {/* Data Dots */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#10b981" />
        ))}
      </svg>
      
      {/* Labels */}
      {displayData.map((d, i) => {
        const p = getCoordinatesForAngle(i * angleStep, 1.25);
        return (
          <div 
            key={i} 
            className="absolute text-[10px] font-black uppercase tracking-wider text-theme-muted text-center w-16 -ml-8 -mt-2"
            style={{ left: p.x, top: p.y }}
          >
            {d.categoryId.substring(0, 10)}
            <div className="text-emerald-500">{Math.round(d.wmi)}%</div>
          </div>
        );
      })}
    </div>
  );
};

export default function WarRoomSection() {
  const [stats, setStats] = useState({ categories: [], tags: [] });

  useEffect(() => {
    getWarRoomStats().then(data => {
      if (data) setStats(data);
    });
  }, []);

  // 1. Calculate Hexagon Radar data (Top 6 Categories by Volume or just all)
  const rawCategories = stats.categories || [];
  const radarData = rawCategories.filter(c => c.categoryId && c.categoryId.toLowerCase() !== 'uncategorized');

  // 2. Calculate Lag % (How far is WMI from target 90% mastery)
  let totalWMI = 0;
  let catCount = radarData.length;
  radarData.forEach(c => { totalWMI += c.wmi; });
  const avgWMI = catCount > 0 ? totalWMI / catCount : 0;
  const targetWMI = 90;
  const lagPercent = catCount > 0 ? Math.max(0, targetWMI - avgWMI) : 0;

  // 3. Weakness Sniper (Most unstable categories and heated tags)
  // High variance = low stability
  const unstableCategories = [...radarData].sort((a, b) => b.stabilityIndex - a.stabilityIndex).slice(0, 3);
  
  // Heated tags: high incorrect ratio
  const heatedTags = [...(stats.tags || [])]
    .filter(t => t.incorrectCount > 0)
    .sort((a, b) => b.incorrectCount - a.incorrectCount)
    .slice(0, 5);

  // 4. PYQ Intelligence
  const pyqTagsData = (stats.tags || []).filter(t => t.tagId.startsWith('pyq: '));
  let totalPyqAttempted = 0;
  let totalPyqCorrect = 0;
  
  pyqTagsData.forEach(t => {
    totalPyqAttempted += (t.correctCount + t.incorrectCount);
    totalPyqCorrect += t.correctCount;
  });
  
  const pyqAccuracy = totalPyqAttempted > 0 ? (totalPyqCorrect / totalPyqAttempted) * 100 : 0;
  
  // Find top PYQ gaps (PYQs with most incorrect)
  const pyqGaps = [...pyqTagsData]
    .filter(t => t.incorrectCount > 0)
    .sort((a, b) => b.incorrectCount - a.incorrectCount)
    .slice(0, 3)
    .map(t => t.tagId.replace('pyq: ', '').toUpperCase());

  return (
    <div className="bg-theme-surface rounded-3xl p-6 md:p-8 border border-theme-border shadow-lg relative overflow-hidden mb-8">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-2xl font-black text-theme-text tracking-tight flex items-center gap-2">
            <Target className="text-rose-500" />
            The War Room
          </h2>
          <p className="text-sm font-bold text-theme-muted uppercase tracking-widest mt-1">
            Combat Briefing & Intelligence
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        
        {/* Hexagon Radar */}
        <div className="bg-theme-bg/50 p-6 rounded-2xl border border-theme-border flex flex-col items-center justify-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-theme-muted mb-6 w-full text-center">Core Mastery Radar</h3>
          <div className="my-4">
            <RadarChart data={radarData} />
          </div>
        </div>

        {/* Lag % Indicator */}
        <div className="bg-theme-bg/50 p-6 rounded-2xl border border-theme-border flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-theme-muted mb-2 flex items-center gap-2">
              <Activity size={14} className="text-blue-500" />
              Mastery Lag
            </h3>
            <p className="text-xs text-theme-muted font-medium mb-6">Distance to 90% Target Mastery</p>
          </div>
          
          <div className="flex items-end gap-3 mb-4">
            <h2 className="text-6xl font-black text-blue-500 leading-none tracking-tighter">
              {lagPercent.toFixed(1)}<span className="text-2xl">%</span>
            </h2>
          </div>
          
          <div className="w-full bg-theme-surface h-3 rounded-full overflow-hidden border border-theme-border">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, 100 - lagPercent)}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-black uppercase text-theme-muted">
            <span>Current: {avgWMI.toFixed(1)}%</span>
            <span>Target: 90%</span>
          </div>
        </div>

        {/* Weakness Sniper */}
        <div className="bg-theme-bg/50 p-6 rounded-2xl border border-theme-border flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
            <Crosshair size={14} />
            Weakness Sniper
          </h3>
          
          <div className="space-y-4 flex-1">
            <div>
              <p className="text-[10px] font-black uppercase text-theme-muted mb-2">Unstable Zones</p>
              {unstableCategories.length > 0 ? unstableCategories.map((c, i) => (
                <div key={i} className="flex justify-between items-center bg-theme-surface p-2 rounded-lg mb-1.5 border border-theme-border/50">
                  <span className="text-xs font-bold">{c.categoryId}</span>
                  <span className="text-[10px] font-black bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded flex items-center gap-1">
                    <TrendingUp size={10} /> Volatile
                  </span>
                </div>
              )) : <div className="text-xs text-theme-muted">No data yet.</div>}
            </div>

            <div>
              <p className="text-[10px] font-black uppercase text-theme-muted mb-2 mt-4">Heated Tags (Mark Leaks)</p>
              <div className="flex flex-wrap gap-1.5">
                {heatedTags.length > 0 ? heatedTags.map((t, i) => (
                  <span key={i} className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md text-[10px] font-black uppercase flex items-center gap-1">
                    <AlertTriangle size={10} /> {t.tagId}
                  </span>
                )) : <div className="text-xs text-theme-muted">No data yet.</div>}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* PYQ Intelligence Widget */}
      <div className="mt-8 bg-theme-bg/50 p-6 rounded-2xl border border-theme-border relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
        <div className="flex-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2">
            <BookOpen size={14} />
            PYQ Intelligence
          </h3>
          <p className="text-[11px] text-theme-muted font-bold">
            Tracking performance on Official Previous Year Questions
          </p>
          
          <div className="flex items-center gap-4 mt-6">
            <div className="w-16 h-16 rounded-2xl border border-amber-500/20 bg-amber-500/10 flex items-center justify-center text-amber-500 font-black text-xl shadow-lg">
              {Math.round(pyqAccuracy)}%
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted mb-1">
                Accuracy Rate
              </p>
              <p className="text-sm font-bold text-theme-text">
                {totalPyqAttempted} PYQs Attempted
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 md:border-l border-theme-border/50 md:pl-6">
          <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted mb-3">
            Critical Action Areas (PYQ Leaks)
          </p>
          {pyqGaps.length > 0 ? (
            <div className="space-y-2">
              {pyqGaps.map((gap, i) => (
                <div key={i} className="flex justify-between items-center bg-theme-surface p-2.5 rounded-xl border border-theme-border/50">
                  <span className="text-xs font-bold text-theme-text">{gap}</span>
                  <span className="text-[9px] font-black uppercase bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-lg border border-rose-500/20">Needs Revision</span>
                </div>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center p-4 bg-theme-surface rounded-xl border border-theme-border/50 text-center">
                <span className="text-emerald-500 mb-1"><Target size={18} /></span>
                <span className="text-xs font-bold text-theme-muted">No major PYQ leaks detected!</span>
             </div>
          )}
        </div>
      </div>

      {/* All Categories Progress (Full Width) */}
      {radarData.length > 0 && (
        <div className="mt-8 bg-theme-bg/50 p-6 rounded-2xl border border-theme-border relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-theme-muted mb-6 flex items-center gap-2">
            <Target size={14} className="text-blue-500" />
            All Fronts (Category Mastery)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...radarData].sort((a,b) => b.wmi - a.wmi).map(c => {
              const masteryColor = c.wmi >= 90 ? 'var(--mastery-90)' : 
                                  c.wmi >= 70 ? 'var(--mastery-70)' :
                                  c.wmi >= 50 ? 'var(--mastery-50)' :
                                  c.wmi >= 30 ? 'var(--mastery-30)' : 'var(--mastery-0)';
              return (
                <div key={c.categoryId} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[11px] font-bold uppercase text-theme-text">
                    <span className="truncate pr-2">{c.categoryId}</span>
                    <span className="shrink-0" style={{ color: masteryColor }}>
                      {Math.round(c.wmi)}%
                    </span>
                  </div>
                  <div className="w-full bg-theme-surface h-1.5 rounded-full overflow-hidden border border-theme-border/50">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ 
                        width: `${Math.max(0, Math.min(100, c.wmi))}%`,
                        backgroundColor: masteryColor 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
