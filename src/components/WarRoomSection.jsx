import React, { useEffect, useState } from 'react';
import { Target, AlertTriangle, Crosshair, TrendingUp, Activity, BookOpen, Info } from 'lucide-react';
import { getWarRoomStats } from '../lib/db';
import { useEconomy } from '../context/EconomyContext';
import { EXAM_CONFIG } from '../lib/mockEngine';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const CATEGORY_DISPLAY = {
  'accountancy': 'Accountancy',
  'ancient-history': 'Ancient Hist.',
  'art-culture': 'Art & Culture',
  'computer-awareness': 'Computer',
  'current-affairs': 'Curr. Affairs',
  'english': 'English',
  'environment': 'Environment',
  'general-science': 'Science & Tech',
  'indian-economy': 'Economy',
  'indian-geography': 'Ind. Geo',
  'indian-polity': 'Polity',
  'jk-affairs': 'J&K Affairs',
  'maths': 'Maths',
  'medieval-history': 'Medieval',
  'modern-history': 'Modern Hist.',
  'physical-geography': 'Phy. Geo',
  'reasoning': 'Reasoning',
  'static-gk': 'Static GK',
  'world-geography': 'World Geo',
};

const getAccuracyColor = (acc, alpha = 1) => {
  if (acc >= 70) return `rgba(16, 185, 129, ${acc >= 70 ? alpha : alpha * 0.7})`;
  if (acc >= 40) return `rgba(245, 158, 11, ${alpha})`;
  return `rgba(244, 63, 94, ${alpha})`;
};

const SubjectRadarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] flex flex-col items-center justify-center text-theme-muted gap-3">
        <Target size={32} className="opacity-30" />
        <p className="text-xs font-bold text-center">Attempt mocks across subjects<br />to build your radar</p>
      </div>
    );
  }

  // Ensure we filter valid categories
  let sorted = [...data]
    .filter(c => c.categoryId && c.categoryId !== 'uncategorized' && (c.totalAttempted || 0) > 0);

  // Guarantee at least 6 spokes to form a clear spiderweb shape
  const fallbackAxes = ['Polity', 'History', 'Geography', 'Economy', 'Science', 'General GK'];
  while (sorted.length < 6) {
    const existingIds = new Set(sorted.map(c => CATEGORY_DISPLAY[c.categoryId] || c.categoryId));
    const missingLabel = fallbackAxes.find(l => !existingIds.has(l));
    sorted.push({
      categoryId: missingLabel || `Topic ${sorted.length + 1}`,
      accuracyRate: 0,
      wmi: 0,
      totalAttempted: 0,
      isPlaceholder: true
    });
  }

  sorted = sorted.sort((a, b) =>
    (CATEGORY_DISPLAY[a.categoryId] || a.categoryId).localeCompare(
      CATEGORY_DISPLAY[b.categoryId] || b.categoryId
    )
  );

  const labels = sorted.map(c => CATEGORY_DISPLAY[c.categoryId] || c.categoryId);
  const accuracyValues = sorted.map(c => Math.round(c.accuracyRate || 0));
  const avgAccuracy = accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length;

  const fillColor = getAccuracyColor(avgAccuracy, 0.15);
  const borderColor = getAccuracyColor(avgAccuracy, 0.85);
  const pointBgColors = accuracyValues.map(v => getAccuracyColor(v, 1));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Accuracy %',
        data: accuracyValues,
        backgroundColor: fillColor,
        borderColor,
        borderWidth: 2,
        pointBackgroundColor: pointBgColors,
        pointBorderColor: 'rgba(255,255,255,0.3)',
        pointBorderWidth: 1.5,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: borderColor,
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.93)',
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.75)',
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          title: (items) => labels[items[0]?.dataIndex] || '',
          label: (context) => {
            const idx = context.dataIndex;
            const cat = sorted[idx];
            if (cat.isPlaceholder) {
              return '  No practice sessions yet';
            }
            const acc = accuracyValues[idx];
            const zone = acc >= 70 ? '🟢 Strong' : acc >= 40 ? '🟡 Needs Work' : '🔴 Weak Zone';
            return [
              `  Accuracy: ${acc}%  ${zone}`,
              `  WMI Score: ${Math.round(cat.wmi || 0)}%`,
              `  Attempted: ${cat.totalAttempted} questions`,
            ];
          },
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        grid: { color: 'rgba(128, 128, 128, 0.12)' },
        angleLines: { color: 'rgba(128, 128, 128, 0.12)' },
        ticks: {
          display: true,
          stepSize: 25,
          color: 'rgba(128, 128, 128, 0.55)',
          font: { size: 8, weight: 'bold' },
          backdropColor: 'transparent',
          callback: val => val === 0 ? '' : `${val}%`,
        },
        pointLabels: {
          color: (ctx) => getAccuracyColor(accuracyValues[ctx.index] ?? 0, 1),
          font: { size: 11, weight: 'bold' },
          padding: 10,
        },
      },
    },
  };

  return (
    <div className="w-full" style={{ height: 280 }}>
      <Radar data={chartData} options={chartOptions} />
    </div>
  );
};

export default function WarRoomSection() {
  const [stats, setStats] = useState({ categories: [], tags: [] });
  const { economy } = useEconomy();

  useEffect(() => {
    getWarRoomStats().then(data => {
      if (data) setStats(data);
    });
  }, []);

  // Filter rawCategories based on the active target exam's categories list
  const rawCategories = stats.categories || [];
  const radarData = rawCategories.filter(c => {
    if (!c.categoryId || c.categoryId.toLowerCase() === 'uncategorized') return false;
    
    // Only allow categories that are defined in CATEGORY_DISPLAY (subjects, not topics)
    if (!CATEGORY_DISPLAY[c.categoryId]) return false;
    
    // If user has a selected target exam, verify that the category is part of the exam config
    if (economy?.target_exam && EXAM_CONFIG[economy.target_exam]) {
      const examCats = EXAM_CONFIG[economy.target_exam].categories || [];
      return examCats.includes(c.categoryId);
    }
    return true;
  });

  // 2. Calculate Lag % (How far is WMI from target 90% mastery)
  let totalWMI = 0;
  // Filter out custom placeholder categories if they got injected into radarData
  const activeCategories = radarData.filter(c => !c.isPlaceholder);
  let catCount = activeCategories.length;
  activeCategories.forEach(c => { totalWMI += (c.wmi || 0); });
  const avgWMI = catCount > 0 ? totalWMI / catCount : 0;
  const targetWMI = 90;
  // Correct standard lag: distance from current avgWMI to targetWMI (capped between 0 and 100)
  const lagPercent = catCount > 0 ? Math.max(0, targetWMI - avgWMI) : 90;

  // Derive strongest and weakest categories by WMI score
  const strongestCategory = catCount > 0 ? [...activeCategories].sort((a, b) => (b.wmi || 0) - (a.wmi || 0))[0] : null;
  const weakestMasteryCategory = catCount > 0 ? [...activeCategories].sort((a, b) => (a.wmi || 0) - (b.wmi || 0))[0] : null;

  // 3. Weakness Sniper (Most unstable categories and heated tags)
  // High variance = low stability
  const unstableCategories = [...activeCategories].sort((a, b) => b.stabilityIndex - a.stabilityIndex).slice(0, 3);
  
  // Heated tags: high incorrect ratio
  const heatedTags = [...(stats.tags || [])]
    .filter(t => t.incorrectCount > 0)
    .sort((a, b) => b.incorrectCount - a.incorrectCount)
    .slice(0, 5);

  // Weakest topics based on tag accuracy rate (aggregated across standard tags & PYQs)
  const aggregatedTags = {};
  (stats.tags || []).forEach(t => {
    const rawClean = t.tagId.replace(/^pyq:\s*/i, '').replace(/^#/, '').trim();
    if (!rawClean) return;
    const upperKey = rawClean.toUpperCase();
    const capitalizedName = rawClean.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    
    if (!aggregatedTags[upperKey]) {
      aggregatedTags[upperKey] = {
        name: capitalizedName,
        correctCount: 0,
        incorrectCount: 0,
        tagId: t.tagId
      };
    }
    aggregatedTags[upperKey].correctCount += t.correctCount;
    aggregatedTags[upperKey].incorrectCount += t.incorrectCount;
  });

  const weakTopics = Object.values(aggregatedTags)
    .map(t => {
      const total = t.correctCount + t.incorrectCount;
      const accuracy = total > 0 ? (t.correctCount / total) * 100 : 0;
      return {
        ...t,
        total,
        accuracy
      };
    })
    .filter(t => t.total >= 1 && t.accuracy < 70)
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return b.incorrectCount - a.incorrectCount;
    })
    .slice(0, 15);

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

  // 4. Weakest category (min 3 questions attempted) for the Weak Zone Alert
  const weakestCategory = (() => {
    const eligible = activeCategories.filter(c => (c.totalAttempted || 0) >= 3);
    if (eligible.length === 0) return null;
    return [...eligible].sort((a, b) => (a.accuracyRate || 0) - (b.accuracyRate || 0))[0];
  })();

  return (
    <div className="bg-theme-surface rounded-3xl p-6 md:p-8 border border-theme-border-soft shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_20px_40px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden mb-8">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-2xl font-black text-theme-text tracking-tight flex items-center gap-2">
            <Target className="text-rose-500" />
            The War Room
          </h2>
          <p className="text-sm font-bold text-theme-muted uppercase tracking-widest mt-1">
            Combat Briefing &amp; Intelligence
          </p>
        </div>
      </div>

      {/* Row 1: Full-width Radar */}
      <div className="bg-theme-bg/50 p-6 rounded-2xl border border-theme-border-soft shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_8px_20px_-6px_rgba(0,0,0,0.4)] hover:-translate-y-[2px] hover:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.05),0_15px_30px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 ease-smooth relative z-10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
            <Target size={13} />
            Expertise Radar
          </h3>
          <div className="h-[1px] w-full bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent mb-5" />
          {/* Hoverable Info icon for zones */}
          <div className="relative group flex items-center">
            <Info size={16} className="text-theme-muted hover:text-theme-text cursor-help transition-colors" />
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col gap-1.5 bg-slate-950/95 border border-theme-border text-[9px] font-black uppercase tracking-wider p-2.5 rounded-xl shadow-xl w-36 z-50">
              <span className="flex items-center gap-1.5 text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Strong ≥70%</span>
              <span className="flex items-center gap-1.5 text-amber-500"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Work 40-69%</span>
              <span className="flex items-center gap-1.5 text-rose-500"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Weak &lt;40%</span>
            </div>
          </div>
        </div>
        <SubjectRadarChart data={radarData} />
      </div>

      {/* Row 2: Mastery Lag + Weakness Sniper side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">

        {/* Lag % Indicator */}
        <div className="bg-theme-bg/50 p-6 rounded-2xl border border-theme-border-soft shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_8px_20px_-6px_rgba(0,0,0,0.4)] hover:-translate-y-[2px] hover:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.05),0_15px_30px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 ease-smooth flex flex-col justify-between h-full">
          <div>
            <h3 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${
              lagPercent >= 15 ? 'text-theme-primary' : 'text-emerald-500'
            }`}>
              <Activity size={14} />
              Mastery Lag
            </h3>
            <div className={`h-[1px] w-full bg-gradient-to-r ${lagPercent >= 15 ? 'from-theme-primary/20 via-theme-primary/5' : 'from-emerald-500/20 via-emerald-500/5'} to-transparent mb-4`} />

            {/* Category WMI extremes overview card */}
            {strongestCategory && weakestMasteryCategory && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5">
                  <span className="text-[8px] font-black uppercase text-emerald-500 block mb-0.5">Top Mastery</span>
                  <span className="text-xs font-bold text-theme-text truncate block">{CATEGORY_DISPLAY[strongestCategory.categoryId] || strongestCategory.categoryId}</span>
                  <span className="text-[10px] font-extrabold text-emerald-500 block mt-0.5">{Math.round(strongestCategory.wmi)}% WMI</span>
                </div>
                <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-2.5">
                  <span className="text-[8px] font-black uppercase text-rose-500 block mb-0.5">Lowest Mastery</span>
                  <span className="text-xs font-bold text-theme-text truncate block">{CATEGORY_DISPLAY[weakestMasteryCategory.categoryId] || weakestCategory.categoryId}</span>
                  <span className="text-[10px] font-extrabold text-rose-500 block mt-0.5">{Math.round(weakestMasteryCategory.wmi)}% WMI</span>
                </div>
              </div>
            )}

            {/* WMI explanation block */}
            <div className="mcq-inner-card bg-theme-bg/40 border border-theme-border-soft rounded-xl p-3.5 space-y-2 mb-4">
              <p className="text-[10px] font-bold text-theme-muted leading-normal">
                 WMI heavily penalizes guesswork. Answer carefully to maximize your score.
              </p>
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-theme-muted pt-1">
                <span>Current WMI avg:</span>
                <span className="text-theme-text font-black">{Math.max(0, avgWMI).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-theme-muted">
                <span>Target threshold:</span>
                <span className="text-emerald-500 font-black">90.0%</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 mt-auto">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Mastery Gap Index:</span>
              <h2 className={`text-4xl font-extrabold leading-none tracking-tighter ${
                lagPercent >= 15 ? 'text-theme-primary' : 'text-emerald-500'
              }`}>
                {lagPercent.toFixed(1)}
                <span className={`text-sm font-black ml-0.5 ${
                  lagPercent >= 15 ? 'text-theme-primary/70' : 'text-emerald-500/70'
                }`}>%</span>
              </h2>
            </div>

            {/* Glowing gradient progress bar container */}
            <div className="w-full bg-theme-bg/60 h-2.5 rounded-full p-[2px] border border-theme-border-soft shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(59,130,246,0.2)] bg-gradient-to-r ${
                  lagPercent >= 15 ? 'from-theme-primary to-indigo-400' : 'from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, 100 - lagPercent))}%` }} 
              />
            </div>
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-theme-muted/70">
              <span>0% Completion</span>
              <span>100% Target Met</span>
            </div>
          </div>
        </div>

        {/* Weakness Sniper */}
        <div className="bg-theme-bg/50 p-6 rounded-2xl border border-theme-border-soft shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_8px_20px_-6px_rgba(0,0,0,0.4)] hover:-translate-y-[2px] hover:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.05),0_15px_30px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 ease-smooth flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
            <Crosshair size={14} />
            Weakness Sniper
          </h3>
          <div className="h-[1px] w-full bg-gradient-to-r from-rose-500/20 via-rose-500/5 to-transparent mb-4" />

          {/* Weak Zone Alert — simple message, no buttons */}
          {weakestCategory && (
            <div className="flex items-start gap-2 bg-rose-500/8 border border-rose-500/20 rounded-xl p-3 mb-4">
              <div className="w-0.5 self-stretch bg-gradient-to-b from-rose-500 to-amber-500 rounded-full shrink-0" />
              <p className="text-[11px] font-bold text-theme-muted leading-relaxed">
                <span className="text-rose-500 font-black">
                  {CATEGORY_DISPLAY[weakestCategory.categoryId] || weakestCategory.categoryId}
                </span>
                {' '}is your weakest subject at{' '}
                <span className="text-rose-500 font-black">{Math.round(weakestCategory.accuracyRate)}% accuracy</span>.
                {' '}Focus here first.
              </p>
            </div>
          )}

          <div className="space-y-3 flex-1">
            <div>
              <p className="text-[10px] font-black uppercase text-theme-muted mb-2">Unstable Zones</p>
              {unstableCategories.length > 0 ? unstableCategories.map((c, i) => (
                <div key={i} className="flex justify-between items-center bg-theme-surface/60 p-2.5 rounded-xl mb-1.5 border border-white/[0.03]">
                  <span className="text-xs font-bold truncate pr-2">{CATEGORY_DISPLAY[c.categoryId] || c.categoryId}</span>
                  <span className="text-[10px] font-black bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                    <TrendingUp size={10} /> Volatile
                  </span>
                </div>
              )) : <div className="text-xs text-theme-muted">No data yet.</div>}
            </div>

            <div>
              <p className="text-[10px] font-black uppercase text-theme-muted mb-2 mt-2">Heated Tags</p>
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

      {/* Critical Weak Topics Tag Cloud */}
      {weakTopics.length > 0 && (
        <div className="mt-8 bg-theme-bg/50 p-5 rounded-2xl border border-theme-border-soft shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_8px_20px_-6px_rgba(0,0,0,0.4)] hover:-translate-y-[2px] hover:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.05),0_15px_30px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 ease-smooth relative z-10 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
              <Crosshair size={14} className="text-rose-500" />
              Critical Weak Topics
            </h3>
            <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest">
              High Error Density
            </span>
          </div>
          <div className="h-[1px] w-full bg-gradient-to-r from-rose-500/20 via-rose-500/5 to-transparent mb-4" />

          <div className="flex flex-wrap items-center justify-center gap-2 py-3.5 px-3 bg-theme-surface/10 rounded-xl border border-white/[0.03]">
            {(() => {
              const maxIncorrect = Math.max(...weakTopics.map(t => t.incorrectCount)) || 1;
              return weakTopics.map(topic => {
                const weight = topic.incorrectCount / maxIncorrect; // 0.0 to 1.0
                
                // Unified compact padding and size classes for premium layout
                const sizeClass = 'text-[10px] font-extrabold px-3.5 py-1.5';
                const opacity = 0.7 + weight * 0.3;
                
                // Visual density styles: critical / medium / low error counts
                const severityStyle = weight > 0.7 
                  ? 'shadow-[0_0_10px_rgba(244,63,94,0.15)] border-rose-500/20 bg-rose-500/10 text-rose-400' 
                  : weight > 0.4
                  ? 'shadow-[0_0_6px_rgba(245,158,11,0.06)] border-amber-500/15 bg-amber-500/8 text-amber-400'
                  : 'border-white/[0.03] bg-theme-surface/40 text-theme-muted';

                return (
                  <div 
                    key={topic.name} 
                    className={`rounded-full border transition-all duration-300 hover:scale-105 hover:border-rose-500/40 select-none ${sizeClass} ${severityStyle}`}
                    style={{ opacity }}
                    title={`${topic.incorrectCount} errors in ${topic.total} attempts`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1 h-1 rounded-full shrink-0 ${
                        weight > 0.7 ? 'bg-rose-500 animate-pulse' : weight > 0.4 ? 'bg-amber-500' : 'bg-theme-muted'
                      }`} />
                      {topic.name}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* PYQ Intelligence Widget */}
      <div className="mt-8 bg-theme-bg/50 p-6 rounded-2xl border border-theme-border-soft shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_8px_20px_-6px_rgba(0,0,0,0.4)] hover:-translate-y-[2px] hover:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.05),0_15px_30px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 ease-smooth relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
        <div className="flex-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2">
            <BookOpen size={14} />
            PYQ Intelligence
          </h3>
          <div className="h-[1px] w-full bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent mb-4" />
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
                <div key={i} className="flex justify-between items-center bg-theme-surface/60 p-2.5 rounded-xl border border-white/[0.03]">
                  <span className="text-xs font-bold text-theme-text">{gap}</span>
                  <span className="text-[9px] font-black uppercase bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-lg border border-rose-500/20">Needs Revision</span>
                </div>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center p-4 bg-theme-surface/60 rounded-xl border border-white/[0.03] text-center">
                <span className="text-emerald-500 mb-1"><Target size={18} /></span>
                <span className="text-xs font-bold text-theme-muted">No major PYQ leaks detected!</span>
             </div>
          )}
        </div>
      </div>

      {/* All Categories Progress (Full Width) */}
      {radarData.length > 0 && (
        <div className="mt-8 bg-theme-bg/50 p-6 rounded-2xl border border-theme-border-soft shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_8px_20px_-6px_rgba(0,0,0,0.4)] hover:-translate-y-[2px] hover:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.05),0_15px_30px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 ease-smooth relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-theme-muted mb-6 flex items-center gap-2">
            <Target size={14} className="text-blue-500" />
            All Fronts (Category Mastery)
          </h3>
          <div className="h-[1px] w-full bg-gradient-to-r from-blue-500/20 via-blue-500/5 to-transparent mb-5" />
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
                  <div className="w-full bg-theme-bg/60 h-1.5 rounded-full overflow-hidden border border-theme-border-soft">
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
