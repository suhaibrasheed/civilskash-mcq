const fs = require('fs');

function updateExamDashboard() {
  const path = '/Users/hakintosh/Documents/MCQKash/civilskash-mcqv1.9/src/components/ExamMockDashboard.jsx';
  let content = fs.readFileSync(path, 'utf8');

  // Imports update
  content = content.replace(
    "import { getSolvedMocks } from '../lib/db';",
    "import { getSolvedMocks, getUserEconomy } from '../lib/db';"
  );

  // Add getColorStyles function
  const colorsHelper = `
const getColorStyles = (tier) => {
  switch (tier) {
    case 'green': return {
      bgLight: 'bg-emerald-500/10', border: 'border-emerald-500/30', hoverBorder: 'hover:border-emerald-500/70',
      badgeBg: 'bg-emerald-500', shadow: 'hover:shadow-[0_24px_48px_-8px_rgba(16,185,129,0.2)]', badgeShadow: 'shadow-emerald-500/30',
      iconBg: 'bg-emerald-500/20', iconText: 'text-emerald-600', iconHoverBg: 'group-hover:bg-emerald-500',
      textMain: 'text-emerald-700', textHover: 'group-hover:text-emerald-600', textSub: 'text-emerald-500/70',
      rowBg: 'bg-emerald-500/8', rowBorder: 'border-emerald-500/25', rowHoverBorder: 'hover:border-emerald-500/60', rowHoverBg: 'hover:bg-emerald-500/12',
      rowIconBg: 'bg-emerald-500/15', badgeText: 'text-emerald-600'
    };
    case 'yellow': return {
      bgLight: 'bg-blue-500/10', border: 'border-blue-500/30', hoverBorder: 'hover:border-blue-500/70',
      badgeBg: 'bg-blue-500', shadow: 'hover:shadow-[0_24px_48px_-8px_rgba(59,130,246,0.2)]', badgeShadow: 'shadow-blue-500/30',
      iconBg: 'bg-blue-500/20', iconText: 'text-blue-600', iconHoverBg: 'group-hover:bg-blue-500',
      textMain: 'text-blue-700', textHover: 'group-hover:text-blue-600', textSub: 'text-blue-500/70',
      rowBg: 'bg-blue-500/8', rowBorder: 'border-blue-500/25', rowHoverBorder: 'hover:border-blue-500/60', rowHoverBg: 'hover:bg-blue-500/12',
      rowIconBg: 'bg-blue-500/15', badgeText: 'text-blue-600'
    };
    case 'amber': return {
      bgLight: 'bg-amber-500/10', border: 'border-amber-500/30', hoverBorder: 'hover:border-amber-500/70',
      badgeBg: 'bg-amber-500', shadow: 'hover:shadow-[0_24px_48px_-8px_rgba(245,158,11,0.2)]', badgeShadow: 'shadow-amber-500/30',
      iconBg: 'bg-amber-500/20', iconText: 'text-amber-600', iconHoverBg: 'group-hover:bg-amber-500',
      textMain: 'text-amber-700', textHover: 'group-hover:text-amber-600', textSub: 'text-amber-500/70',
      rowBg: 'bg-amber-500/8', rowBorder: 'border-amber-500/25', rowHoverBorder: 'hover:border-amber-500/60', rowHoverBg: 'hover:bg-amber-500/12',
      rowIconBg: 'bg-amber-500/15', badgeText: 'text-amber-600'
    };
    case 'red': return {
      bgLight: 'bg-rose-500/10', border: 'border-rose-500/30', hoverBorder: 'hover:border-rose-500/70',
      badgeBg: 'bg-rose-500', shadow: 'hover:shadow-[0_24px_48px_-8px_rgba(244,63,94,0.2)]', badgeShadow: 'shadow-rose-500/30',
      iconBg: 'bg-rose-500/20', iconText: 'text-rose-600', iconHoverBg: 'group-hover:bg-rose-500',
      textMain: 'text-rose-700', textHover: 'group-hover:text-rose-600', textSub: 'text-rose-500/70',
      rowBg: 'bg-rose-500/8', rowBorder: 'border-rose-500/25', rowHoverBorder: 'hover:border-rose-500/60', rowHoverBg: 'hover:bg-rose-500/12',
      rowIconBg: 'bg-rose-500/15', badgeText: 'text-rose-600'
    };
    default: return null;
  }
};
`;

  // Replace SolvedBadge
  const oldSolvedBadge = `function SolvedBadge({ solvedInfo }) {
  if (!solvedInfo) return null;
  if (solvedInfo.isGood) {
    return (
      <div className="absolute -top-2 -right-2 z-20 flex items-center gap-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md shadow-emerald-500/30">
        <CheckCircle2 size={8} />
        {solvedInfo.percentage}%
      </div>
    );
  }
  return (
    <div className="absolute -top-2 -right-2 z-20 flex items-center gap-1 bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md shadow-amber-500/30">
      <TrendingUp size={8} />
      {solvedInfo.percentage}%
    </div>
  );
}`;

  const newSolvedBadge = `${colorsHelper}
// ─── Accomplishment Badge ───────────────────────────────────────────
function SolvedBadge({ solvedInfo }) {
  if (!solvedInfo) return null;
  const colors = getColorStyles(solvedInfo.scoreTier);
  return (
    <div className={\`absolute -top-2 -right-2 z-20 flex items-center gap-1 \${colors.badgeBg} text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md \${colors.badgeShadow}\`}>
      {solvedInfo.scoreTier === 'green' ? <CheckCircle2 size={8} /> : <TrendingUp size={8} />}
      {solvedInfo.percentage}%
    </div>
  );
}`;

  content = content.replace(oldSolvedBadge, newSolvedBadge);

  // Replace EliteTile
  const oldEliteTile = /function EliteTile\(\{ mock, index, examId, solvedMap \}\) \{[\s\S]*?\}\n\n\/\*\* Quick Mock row item \*\//;
  const newEliteTile = `function EliteTile({ mock, index, examId, solvedMap, isLocked }) {
  const navigate  = useNavigate();
  const solved    = solvedMap?.[mock.id];
  const colors    = solved ? getColorStyles(solved.scoreTier) : null;

  if (mock.isEmpty || isLocked) {
    return (
      <div className={\`group relative bg-theme-surface/20 border border-theme-border/20 rounded-2xl p-5 overflow-hidden \${isLocked ? 'opacity-80' : 'opacity-50'}\`}>
        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-theme-surface border border-theme-border flex items-center justify-center text-theme-muted">
            <Lock size={18} className={isLocked ? 'text-rose-400' : ''} />
          </div>
          <div>
            <h4 className="font-black text-theme-muted text-sm">Elite Mock {index}</h4>
            <p className="text-[10px] uppercase tracking-[0.15em] text-theme-muted/70 font-bold mt-1">
              {isLocked ? 'PRO ONLY' : 'No questions yet'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <SolvedBadge solvedInfo={solved} />
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/mock-test', { state: { mock, from: '/', examId } })}
        className={\`group relative backdrop-blur-lg rounded-2xl p-5 cursor-pointer overflow-hidden transition-all duration-500
          \${colors 
            ? \`\${colors.bgLight} border \${colors.border} \${colors.hoverBorder} \${colors.shadow}\` 
            : 'bg-theme-surface/60 border border-theme-primary/20 hover:border-theme-primary/60 hover:shadow-[0_24px_48px_-8px_rgba(var(--color-primary),0.2)]'
          }\`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-theme-primary/0 to-theme-primary/8 group-hover:to-theme-primary/15 transition-all duration-700 rounded-2xl" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-theme-primary/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-theme-primary/25 transition-colors duration-700" />

        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-400 shadow-lg
            \${colors 
              ? \`\${colors.iconBg} border \${colors.border} \${colors.iconText} \${colors.iconHoverBg} group-hover:text-white group-hover:border-transparent group-hover:scale-110\`
              : 'bg-theme-primary/10 border border-theme-primary/20 text-theme-primary group-hover:bg-theme-primary group-hover:text-white group-hover:border-theme-primary group-hover:scale-110'
            }\`}
          >
            {index}
          </div>
          <div>
            <h4 className={\`font-black text-sm transition-colors
              \${colors ? \`\${colors.textMain} \${colors.textHover}\` : 'text-theme-text group-hover:text-theme-primary'}\`}
            >
              Elite Mock {index}
            </h4>
            <p className={\`text-[10px] uppercase tracking-[0.15em] font-bold mt-1
              \${colors ? colors.textSub : 'text-theme-primary/70'}\`}
            >
              {solved ? \`Best: \${solved.percentage}%\` : '100Q • 100 Min'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** Quick Mock row item */`;

  content = content.replace(oldEliteTile, newEliteTile);

  // Replace QuickMockRow
  const oldQuickMockRow = /function QuickMockRow\(\{ mock, examId, solvedMap \}\) \{[\s\S]*?\}\n\n\/\*\* Sectional Mock row item \*\//;
  const newQuickMockRow = `function QuickMockRow({ mock, examId, solvedMap, isLocked }) {
  const navigate = useNavigate();
  const solved   = solvedMap?.[mock.id];
  const colors   = solved ? getColorStyles(solved.scoreTier) : null;

  if (mock.isEmpty || isLocked) {
    return (
      <div className={\`flex items-center gap-4 p-4 rounded-xl bg-theme-surface/20 border border-theme-border/20 \${isLocked ? 'opacity-80' : 'opacity-50'}\`}>
        <div className="w-9 h-9 shrink-0 rounded-xl bg-theme-bg border border-theme-border flex items-center justify-center">
          <Lock size={14} className={isLocked ? 'text-rose-400' : 'text-theme-muted'} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-theme-muted">{mock.title}</h4>
          <p className="text-[10px] text-theme-muted uppercase tracking-widest mt-0.5 opacity-60">
            {isLocked ? 'PRO ONLY' : 'No questions yet'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      whileHover={{ x: 4 }}
      onClick={() => navigate('/mock-test', { state: { mock, from: '/', examId } })}
      className={\`group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300
        \${colors
          ? \`\${colors.rowBg} \${colors.rowBorder} \${colors.rowHoverBorder} \${colors.rowHoverBg}\`
          : 'bg-theme-surface/40 border-theme-border/40 hover:border-theme-primary/50 hover:bg-theme-surface/80'
        }\`}
    >
      <div className="flex items-center gap-4">
        <div className={\`w-9 h-9 shrink-0 rounded-xl font-black text-sm flex items-center justify-center transition-all shadow-sm
          \${colors
            ? \`\${colors.rowIconBg} border \${colors.border} \${colors.iconText} \${colors.iconHoverBg} group-hover:text-white group-hover:border-transparent\`
            : 'bg-theme-bg border border-theme-border text-theme-text group-hover:bg-theme-primary group-hover:text-white group-hover:border-theme-primary'
          }\`}
        >
          {mock.index}
        </div>
        <div>
          <h4 className={\`text-sm font-bold leading-tight transition-colors
            \${colors ? \`\${colors.textMain} \${colors.textHover}\` : 'text-theme-text group-hover:text-theme-primary'}\`}
          >
            {mock.title}
          </h4>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest mt-0.5 opacity-60">
            {solved ? \`Solved · Best \${solved.percentage}%\` : '10 Qs • 10 Mins'}
          </p>
        </div>
      </div>
      {solved ? (
        <div className={\`shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full \${colors.rowIconBg} \${colors.badgeText}\`}>
          {solved.scoreTier === 'green' ? <CheckCircle2 size={10} /> : <TrendingUp size={10} />}
          {solved.scoreTier === 'green' ? 'Good' : 'Review'}
        </div>
      ) : (
        <ChevronRight size={16} className="text-theme-muted group-hover:text-theme-primary group-hover:translate-x-1 transition-all shrink-0" />
      )}
    </motion.div>
  );
}

/** Sectional Mock row item */`;

  content = content.replace(oldQuickMockRow, newQuickMockRow);

  // Replace SectionalMockRow
  const oldSectionalMockRow = /function SectionalMockRow\(\{ mock, examId, solvedMap \}\) \{[\s\S]*?\}\n\n\/\*\* Empty state when a section has no content \*\//;
  const newSectionalMockRow = `function SectionalMockRow({ mock, examId, solvedMap, isLocked }) {
  const navigate = useNavigate();
  const solved   = solvedMap?.[mock.id];
  const colors   = solved ? getColorStyles(solved.scoreTier) : null;

  if (mock.isEmpty || isLocked) {
    return (
      <div className={\`flex items-center gap-4 p-4 rounded-xl bg-theme-surface/20 border border-theme-border/20 \${isLocked ? 'opacity-80' : 'opacity-50'}\`}>
        <div className="w-9 h-9 shrink-0 rounded-xl bg-theme-bg border border-theme-border flex items-center justify-center">
          <Lock size={14} className={isLocked ? 'text-rose-400' : 'text-theme-muted'} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-theme-muted">{mock.title}</h4>
          <p className="text-[10px] text-theme-muted uppercase tracking-widest mt-0.5 opacity-60">
            {isLocked ? 'PRO ONLY' : 'No questions yet'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      whileHover={{ x: 4 }}
      onClick={() => navigate('/mock-test', { state: { mock, from: '/', examId } })}
      className={\`group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300
        \${colors
          ? \`\${colors.rowBg} \${colors.rowBorder} \${colors.rowHoverBorder} \${colors.rowHoverBg}\`
          : 'bg-theme-surface/40 border-theme-border/40 hover:border-theme-accent/50 hover:bg-theme-surface/80'
        }\`}
    >
      <div className="flex items-center gap-4">
        <div className={\`w-9 h-9 shrink-0 rounded-xl font-black text-sm flex items-center justify-center transition-all shadow-sm
          \${colors
            ? \`\${colors.rowIconBg} border \${colors.border} \${colors.iconText} \${colors.iconHoverBg} group-hover:text-white group-hover:border-transparent\`
            : 'bg-theme-bg border border-theme-border text-theme-text group-hover:bg-theme-accent group-hover:text-white group-hover:border-theme-accent'
          }\`}
        >
          {mock.index}
        </div>
        <div>
          <h4 className={\`text-sm font-bold leading-tight transition-colors
            \${colors ? \`\${colors.textMain} \${colors.textHover}\` : 'text-theme-text group-hover:text-theme-accent'}\`}
          >
            {mock.title}
          </h4>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest mt-0.5 opacity-60">
            {solved ? \`Solved · Best \${solved.percentage}%\` : '10 Qs • 10 Mins'}
          </p>
        </div>
      </div>
      {solved ? (
        <div className={\`shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full \${colors.rowIconBg} \${colors.badgeText}\`}>
          {solved.scoreTier === 'green' ? <CheckCircle2 size={10} /> : <TrendingUp size={10} />}
          {solved.scoreTier === 'green' ? 'Good' : 'Review'}
        </div>
      ) : (
        <ChevronRight size={16} className="text-theme-muted group-hover:text-theme-accent group-hover:translate-x-1 transition-all shrink-0" />
      )}
    </motion.div>
  );
}

/** Empty state when a section has no content */`;

  content = content.replace(oldSectionalMockRow, newSectionalMockRow);

  // Update Main Component state and passing isLocked
  content = content.replace(
    "const [solvedMap, setSolvedMap]     = useState({});",
    "const [solvedMap, setSolvedMap]     = useState({});\n  const [userEconomy, setUserEconomy] = useState(null);"
  );

  content = content.replace(
    "getSolvedMocks().then(setSolvedMap).catch(() => {});",
    "getSolvedMocks().then(setSolvedMap).catch(() => {});\n    getUserEconomy().then(setUserEconomy).catch(() => {});"
  );

  content = content.replace(
    "const displayedElite = showAllElite ? eliteMocks : eliteMocks.slice(0, 5);",
    "const displayedElite = showAllElite ? eliteMocks : eliteMocks.slice(0, 5);\n  const isFreeUser = userEconomy?.user_tier === 'FREE';"
  );

  content = content.replace(
    "<EliteTile key={mock.id} mock={mock} index={mock.index} examId={exam.id} solvedMap={solvedMap} />",
    "<EliteTile key={mock.id} mock={mock} index={mock.index} examId={exam.id} solvedMap={solvedMap} isLocked={isFreeUser && mock.index > 5} />"
  );

  content = content.replace(
    "<QuickMockRow key={mock.id} mock={mock} examId={exam.id} solvedMap={solvedMap} />",
    "<QuickMockRow key={mock.id} mock={mock} examId={exam.id} solvedMap={solvedMap} isLocked={isFreeUser && mock.index > 75} />"
  );

  content = content.replace(
    "<SectionalMockRow key={mock.id} mock={mock} examId={exam.id} solvedMap={solvedMap} />",
    "<SectionalMockRow key={mock.id} mock={mock} examId={exam.id} solvedMap={solvedMap} isLocked={isFreeUser && mock.index > 30} />"
  );

  fs.writeFileSync(path, content);
  console.log("ExamMockDashboard updated.");
}

updateExamDashboard();
