import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { User, Award, TrendingDown, Flame, Trophy } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Avatar from './Avatars';

/* ─── Smooth count‑up helper ─── */
const AnimatedNumber = ({ value, decimals = 0, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    const end = parseFloat(value);
    if (isNaN(end)) { setDisplay(String(value)); return; }
    let raf;
    const start = performance.now();
    const duration = 1300;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplay((ease * end).toFixed(decimals));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, decimals]);
  return <span>{prefix}{display}{suffix}</span>;
};

/* ─── Interactive Particle Canvas ─── */
const ParticleCanvas = ({ theme }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    const particleCount = 35;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width  = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    const getColors = () => {
      if (theme === 'dark') return [
        { r: 251, g: 191, b: 36,  base: 0.28 }, // gold
        { r: 245, g: 158, b: 11,  base: 0.20 }, // amber
        { r: 129, g: 140, b: 248, base: 0.15 }, // indigo
        { r: 255, g: 255, b: 255, base: 0.40 }, // diamond spark
      ];
      if (theme === 'sepia') return [
        { r: 154, g: 52,  b: 18,  base: 0.45 }, // rich terracotta
        { r: 120, g: 50,  b: 10,  base: 0.40 }, // brown-amber
        { r: 160, g: 100, b: 20,  base: 0.38 }, // honey
      ];
      return [ // light
        { r: 67,  g: 97,  b: 238, base: 0.45 }, // indigo
        { r: 114, g: 9,   b: 183, base: 0.38 }, // violet
        { r: 14,  g: 116, b: 144, base: 0.42 }, // cyan/teal
        { r: 71,  g: 85,  b: 105, base: 0.32 }, // deep slate
      ];
    };

    class Particle {
      constructor(initY) {
        this.reset();
        if (initY !== undefined) {
          this.y = initY;
        } else {
          this.y = Math.random() * canvas.height;
        }
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 10;
        this.size = Math.random() * 1.8 + 0.6; // 0.6 to 2.4 px
        this.speedY = -(Math.random() * 0.12 + 0.06); // slow upward float
        this.speedX = (Math.random() - 0.5) * 0.06; // slow drift
        this.phase = Math.random() * Math.PI * 2;
        this.twinkleSpeed = 0.006 + Math.random() * 0.012; // slow twinkling
        const cols = getColors();
        this.col = cols[Math.floor(Math.random() * cols.length)];
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.phase) * 0.05; // gentle sine wave wobble
        this.phase += this.twinkleSpeed;

        if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
          this.reset();
        }
      }

      draw() {
        const twinkle = 0.5 + 0.5 * Math.sin(this.phase);
        const alpha = this.col.base * twinkle;
        const { r, g, b } = this.col;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.fill();
      }
    }

    const particles = Array.from(
      { length: particleCount },
      (_, i) => new Particle((i / particleCount) * canvas.height)
    );

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 rounded-[22px]"
      style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'normal' }}
    />
  );
};

/* ─── Theme token resolver ─── */
const useTokens = (theme, isPro) => {
  if (theme === 'light') return {
    card:        'bg-gradient-to-br from-white via-[#f8f9ff] to-[#f0f3ff] border border-[#c8d3f5]/60 shadow-[0_24px_60px_rgba(67,97,238,0.08),0_4px_12px_rgba(67,97,238,0.04)]',
    statsPanel:  'bg-[#eef1fb]/70 border border-[#c8d3f5]/50 backdrop-blur-md',
    badge:       isPro
      ? 'bg-gradient-to-r from-[#4361ee] to-[#7209b7] border border-[#4361ee]/45 text-white font-black shadow-[0_2px_8px_rgba(67,97,238,0.2)] animate-pro-glow-indigo'
      : 'bg-[#4361ee]/[0.06] border border-[#4361ee]/[0.18] text-[#4361ee] backdrop-blur-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),_inset_0_-1px_2px_rgba(0,0,0,0.05),_0_2px_6px_rgba(0,0,0,0.04)]',
    badgeIcon:   isPro ? 'text-white' : 'text-[#4361ee]',
    name:        'text-[#0b1639]',
    nameGrad:    isPro ? 'bg-gradient-to-r from-[#4361ee] via-[#7209b7] to-[#4361ee] bg-clip-text text-transparent' : '',
    handle:      'text-[#4361ee] font-black tracking-widest',
    rankLine:    'text-[#4f618a]',
    rankHighlight: 'text-[#0b1639] font-extrabold',
    iconWrap:    ['bg-amber-100  border border-amber-200/80  text-amber-600',
                  'bg-indigo-100 border border-indigo-200/80 text-indigo-600',
                  'bg-rose-100   border border-rose-200/80   text-rose-500'],
    statLabel:   'text-[#4f618a]',
    statValue:   ['text-amber-600', 'text-indigo-600', 'text-rose-500'],
    divider:     'border-[#c8d3f5]/40',
    avatarRing:  'border-white/80',
    ringStroke:  isPro ? '#7209b7' : '#4361ee',
    ringTrack:   'rgba(0,0,0,0.06)',
    haloColor:   'bg-indigo-300',
    glow:        true,
    glowClass:   'animate-card-glow-light',
    glowBorder:  '#4361ee',
    hoverGlow:   'group-hover:shadow-[0_0_35px_rgba(67,97,238,0.22)]',
    outerBorder: 'linear-gradient(145deg, rgba(67,97,238,0.22) 0%, rgba(114,9,183,0.12) 50%, rgba(67,97,238,0.18) 100%)',
    outerBorderHover: 'linear-gradient(145deg, rgba(67,97,238,0.60) 0%, rgba(114,9,183,0.50) 50%, rgba(67,97,238,0.60) 100%)',
    editBtn:     'bg-white border border-[#c8d3f5] text-[#4361ee] hover:bg-slate-50',
  };

  if (theme === 'sepia') return {
    card:        'bg-gradient-to-br from-[#FAF7EF] via-[#F7F0E3] to-[#EFE4CC]/80 border border-[#d4bc8a]/50 shadow-[0_24px_60px_rgba(154,52,18,0.06)]',
    statsPanel:  'bg-[#EFE4CC]/60 border border-[#d4bc8a]/50 backdrop-blur-md',
    badge:       isPro
      ? 'bg-gradient-to-r from-[#b45309] to-[#d97706] border border-[#b45309]/50 text-amber-50 font-black shadow-[0_2px_8px_rgba(180,83,9,0.2)] animate-pro-glow-sepia'
      : 'bg-[#7c5e3d]/[0.06] border border-[#7c5e3d]/[0.2] text-[#7c5e3d] backdrop-blur-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),_inset_0_-1px_2px_rgba(0,0,0,0.05),_0_2px_6px_rgba(0,0,0,0.03)]',
    badgeIcon:   isPro ? 'text-amber-50' : 'text-[#7c5e3d]',
    name:        'text-[#261708]',
    nameGrad:    isPro ? 'bg-gradient-to-r from-[#261708] via-[#b45309] to-[#261708] bg-clip-text text-transparent' : '',
    handle:      'text-[#9a3412] font-black tracking-widest',
    rankLine:    'text-[#6b4e28]',
    rankHighlight: 'text-[#261708] font-extrabold',
    iconWrap:    ['bg-[#b45309]/10 border border-[#b45309]/20 text-[#b45309]',
                  'bg-[#65704a]/10 border border-[#65704a]/20 text-[#65704a]',
                  'bg-[#9a3412]/10 border border-[#9a3412]/20 text-[#9a3412]'],
    statLabel:   'text-[#6b4e28]',
    statValue:   ['text-[#b45309]', 'text-[#65704a]', 'text-[#9a3412]'],
    divider:     'border-[#d4bc8a]/35',
    avatarRing:  'border-[#faf6eb]',
    ringStroke:  isPro ? '#b45309' : '#65704a',
    ringTrack:   'rgba(154,52,18,0.08)',
    haloColor:   'bg-amber-800',
    glow:        true,
    glowClass:   'animate-card-glow-sepia',
    glowBorder:  '#9a3412',
    hoverGlow:   'group-hover:shadow-[0_0_35px_rgba(154,52,18,0.18)]',
    outerBorder: 'linear-gradient(145deg, rgba(154,52,18,0.20) 0%, rgba(212,188,138,0.10) 50%, rgba(154,52,18,0.16) 100%)',
    outerBorderHover: 'linear-gradient(145deg, rgba(154,52,18,0.55) 0%, rgba(212,188,138,0.38) 50%, rgba(154,52,18,0.50) 100%)',
    editBtn:     'bg-[#faf6eb] border border-[#d4bc8a] text-[#9a3412] hover:bg-[#eedfb5]/50',
  };

  /* ── DARK (default) ── */
  return {
    card:        'bg-gradient-to-br from-[#0f1729]/95 via-[#0b1120]/95 to-[#07090f]/95 border border-white/[0.07] shadow-[0_30px_70px_rgba(0,0,0,0.55),0_1px_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-2xl',
    statsPanel:  'bg-[#080d19]/70 border border-white/[0.06] backdrop-blur-md',
    badge:       isPro
      ? 'bg-[#0b1120]/90 border border-amber-500/50 text-amber-400 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(251,191,36,0.15)] animate-pro-glow'
      : 'bg-white/[0.04] border border-white/[0.15] text-slate-300 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),_inset_0_-1px_2px_rgba(0,0,0,0.4),_0_2px_6px_rgba(0,0,0,0.3)]',
    badgeIcon:   isPro ? 'text-amber-400' : 'text-slate-300',
    name:        'text-[#eef2ff]',
    nameGrad:    isPro ? 'bg-gradient-to-r from-[#eef2ff] via-amber-400 to-[#eef2ff] bg-clip-text text-transparent' : '',
    handle:      'text-amber-400/80 font-black tracking-widest',
    rankLine:    'text-[#8899bb]',
    rankHighlight: 'text-[#eef2ff] font-extrabold',
    iconWrap:    ['bg-amber-500/[0.10] border border-amber-500/20  text-amber-400',
                  'bg-indigo-500/[0.10] border border-indigo-500/20 text-indigo-400',
                  'bg-rose-500/[0.10]   border border-rose-500/20   text-rose-400'],
    statLabel:   'text-[#8899bb]',
    statValue:   ['text-amber-400', 'text-indigo-400', 'text-rose-400'],
    divider:     'border-white/[0.05]',
    avatarRing:  'border-[#0b1120]',
    ringStroke:  isPro ? '#fbbf24' : '#6366f1',
    ringTrack:   'rgba(255,255,255,0.04)',
    haloColor:   isPro ? 'from-amber-500 via-yellow-400 to-amber-500' : 'from-amber-600 to-amber-700',
    glow:        true,
    glowClass:   'animate-card-glow-dark',
    glowBorder:  '#fbbf24',
    hoverGlow:   'group-hover:shadow-[0_0_40px_rgba(251,191,36,0.32)]',
    outerBorder: 'linear-gradient(145deg, rgba(251,191,36,0.38) 0%, rgba(99,102,241,0.16) 50%, rgba(251,191,36,0.28) 100%)',
    outerBorderHover: 'linear-gradient(145deg, rgba(251,191,36,0.85) 0%, rgba(99,102,241,0.55) 50%, rgba(251,191,36,0.75) 100%)',
    editBtn:     'bg-[#101827] border border-white/10 text-amber-400 hover:bg-[#16202e]',
  };
};

/* ═══════════════════════════════════════════════════
   PREMIUM PROFILE CARD
   - Portrait (mobile): stacked, avatar centred, stats below
   - Landscape (desktop): avatar+identity left, stats panel right
   - 3D tilt on hover, spinning conic border glow
   - Beautiful Canvas Particle Effect background (Fluid Simulation)
   ════════════════════════════════════════════════════ */
export default function PremiumProfileCard({
  economy, userRank, totalAspirants,
  onEditCharacter,
}) {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const isPro = economy?.user_tier === 'Pro';
  const tok = useTokens(theme, isPro);

  const rankVal   = userRank   ?? 37;
  const totalVal  = totalAspirants ?? 1490;
  const pctVal    = (userRank && totalAspirants)
    ? ((userRank / totalAspirants) * 100).toFixed(1)
    : '2.5';
  const streakVal = economy?.current_streak_days ?? 12;
  const isDark    = theme === 'dark';

  /* SVG arc ── depicts "Among Top" percentile dynamically (100 - pctVal) */
  const pctNum = parseFloat(pctVal);
  const percent = isNaN(pctNum) ? 50 : Math.max(1, Math.min(99.5, 100 - pctNum));
  const arcTotal = 2 * Math.PI * 44;
  const arcFill  = arcTotal * (percent / 100);
  const arcGap   = arcTotal - arcFill;

  /* ── 3-D tilt ── */
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useTransform(y, [-0.5, 0.5], [6, -6]);
  const rotY = useTransform(x, [-0.5, 0.5], [-6, 6]);
  const spring = { damping: 28, stiffness: 230, mass: 0.5 };
  const rotXs  = useSpring(rotX, spring);
  const rotYs  = useSpring(rotY, spring);

  const onMove  = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width  - 0.5);
    y.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  /* ── Stats data ── */
  const stats = [
    {
      icon:  <Award size={20} strokeWidth={2.2} />,
      label: 'YOUR RANK',
      val:   rankVal,
      dec:   0,
      pfx:   '#',
      sfx:   '',
      idx:   0,
    },
    {
      icon:  <TrendingDown size={20} strokeWidth={2.2} />,
      label: 'AMONG TOP',
      val:   pctVal,
      dec:   1,
      pfx:   '',
      sfx:   '%',
      idx:   1,
    },
    {
      icon:  <Flame size={20} strokeWidth={2.2} fill="currentColor" />,
      label: 'ACTIVE STREAK',
      val:   streakVal,
      dec:   0,
      pfx:   '',
      sfx:   'd',
      idx:   2,
    },
  ];

  return (
    /* ── Outer wrapper — gradient fill creates the premium border ── */
    <div
      className={`relative rounded-3xl p-[2px] overflow-hidden group mb-8 transition-all duration-500 ${tok.hoverGlow} ${tok.glowClass}`}
      style={{
        perspective: 900,
        background: isHovered ? tok.outerBorderHover : tok.outerBorder,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); onLeave(); }}
    >

      {/* ── Inner card with 3-D tilt ── */}
      <motion.div
        style={{ rotateX: rotXs, rotateY: rotYs, transformStyle: 'preserve-3d' }}
        onMouseMove={onMove}
        className={`relative rounded-[22px] overflow-hidden transition-colors duration-500 z-10 ${tok.card}`}
      >
        {/* Particle System Canvas */}
        <ParticleCanvas theme={theme} />

        {/* Ambient glow blobs — theme‑sensitive */}
        {theme === 'dark' && (
          <>
            <div className="absolute -top-24 left-[10%] w-72 h-72 bg-amber-500/[0.042] rounded-full blur-[90px] pointer-events-none z-0" />
            <div className="absolute -bottom-16 right-[25%] w-52 h-52 bg-indigo-500/[0.042] rounded-full blur-[70px] pointer-events-none z-0" />
          </>
        )}
        {theme === 'light' && (
          <>
            <div className="absolute -top-20 left-[15%] w-64 h-64 bg-indigo-400/[0.06] rounded-full blur-[80px] pointer-events-none z-0" />
            <div className="absolute -bottom-12 right-[20%] w-48 h-48 bg-violet-400/[0.05] rounded-full blur-[60px] pointer-events-none z-0" />
          </>
        )}
        {theme === 'sepia' && (
          <>
            <div className="absolute -top-20 left-[15%] w-64 h-64 rounded-full blur-[80px] pointer-events-none z-0" style={{ background: 'rgba(180,83,9,0.06)' }} />
            <div className="absolute -bottom-12 right-[20%] w-48 h-48 rounded-full blur-[60px] pointer-events-none z-0" style={{ background: 'rgba(154,52,18,0.04)' }} />
          </>
        )}

        {/* ════════════ MAIN LAYOUT ════════════ */}
        <div className="relative z-10 flex flex-col md:flex-row gap-0 md:gap-6 p-6 md:p-8">

          {/* ────── LEFT / TOP — Identity ────── */}
          <div className="flex-1 flex flex-col justify-center min-w-0">

            <div className="flex flex-col md:flex-row items-center md:items-center gap-5 md:gap-6">

              {/* AVATAR with progress ring */}
              <div
                className="relative shrink-0 flex items-center justify-center z-10"
                style={{ width: 118, height: 118 }}
              >
                {/* Soft glow behind ring — dark only */}
                {isDark && (
                  <div
                    className={`absolute inset-0 rounded-full blur-[20px] opacity-35 bg-gradient-to-br ${tok.haloColor}`}
                  />
                )}

                {/* SVG progress ring */}
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                  viewBox="0 0 100 100"
                >
                  <circle cx="50" cy="50" r="44" fill="none"
                    stroke={tok.ringTrack} strokeWidth="3" />
                  <circle cx="50" cy="50" r="44" fill="none"
                    stroke={tok.ringStroke}
                    strokeWidth="3.5"
                    strokeDasharray={`${arcFill} ${arcGap}`}
                    strokeLinecap="round"
                    style={{
                      filter: isDark ? `drop-shadow(0 0 5px ${tok.ringStroke}aa)` : 'none',
                      transition: 'stroke-dasharray 1.8s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  />
                </svg>

                {/* Avatar */}
                <div
                  className={`relative z-10 w-[90px] h-[90px] rounded-full border-[3px] ${tok.avatarRing} overflow-hidden shadow-xl flex items-center justify-center`}
                  style={{ background: isDark ? '#0b1120' : theme === 'sepia' ? '#faf6eb' : '#ffffff' }}
                >
                  <Avatar id={economy?.avatar_id || 1} className="w-full h-full object-cover" />
                </div>

                {/* Edit button */}
                <button
                  onClick={onEditCharacter}
                  title="Edit Character"
                  className={`absolute bottom-0.5 right-0.5 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110 active:scale-95 ${tok.editBtn}`}
                >
                  <User size={12} strokeWidth={2.8} />
                </button>
              </div>

              {/* ── Name / badge / handle — centred on mobile, left on desktop ── */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0 mt-1 z-10">

                {/* Membership badge — polished, clean & theme-sensitive */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2.5 backdrop-blur-sm select-none ${tok.badge}`}>
                  {isPro ? (
                    <Trophy className={`w-3 h-3 ${tok.badgeIcon}`} />
                  ) : (
                    <svg className={`w-3.5 h-3.5 ${tok.badgeIcon}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l7 4v6c0 5-3.5 9.7-7 11C8.5 21.7 5 17 5 12V6l7-4z" />
                    </svg>
                  )}
                  {isPro ? 'PRO MEMBER' : 'FREE MEMBER'}
                </div>

                {/* Name */}
                <h1
                  className={`text-[1.85rem] md:text-[2.15rem] leading-none font-[950] tracking-tight mb-1 truncate max-w-[280px] md:max-w-none ${tok.nameGrad || tok.name}`}
                  style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
                >
                  {economy?.full_name || 'Aspirant'}
                </h1>

                {/* Handle in lowercase */}
                {economy?.username && (
                  <p className={`text-xs mb-3 lowercase ${tok.handle}`}>
                    @{economy.username.toLowerCase()}
                  </p>
                )}

                {/* Rank line: "Ranked #X out of #Y Aspirants" — sleek capsule */}
                <div className={`inline-flex items-center justify-center md:justify-start gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold backdrop-blur-md transition-all shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.06)] ${
                  theme === 'dark' 
                    ? 'bg-amber-500/[0.07] border border-amber-500/20 text-amber-200/90' 
                    : theme === 'sepia' 
                    ? 'bg-[#b45309]/[0.06] border border-[#b45309]/15 text-[#854d0e]' 
                    : 'bg-[#4361ee]/[0.05] border border-[#4361ee]/15 text-[#4361ee]'
                }`}>
                  <Trophy size={13} className={`shrink-0 ${
                    theme === 'dark' ? 'text-amber-400' : theme === 'sepia' ? 'text-amber-700' : 'text-[#4361ee]'
                  }`} />
                  <span>
                    Ranked{' '}
                    <span className="font-extrabold text-theme-primary">#{rankVal}</span>
                    {' '}out of{' '}
                    <span className="font-extrabold text-theme-primary">{totalVal.toLocaleString()}</span>
                    {' '}Aspirants
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ────── RIGHT / BOTTOM — Stats Panel ────── */}
          <div
            className={`flex-shrink-0 rounded-2xl flex flex-col justify-between overflow-hidden transition-colors duration-500 w-full md:w-[215px] lg:w-[245px] mt-5 md:mt-0 z-10 ${tok.statsPanel}`}
          >
            {stats.map((s, i) => (
              <React.Fragment key={s.label}>
                <div className="flex items-center gap-4 px-5 py-[18px]">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border transition-colors duration-500 ${tok.iconWrap[s.idx]}`}>
                    {s.icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] leading-none mb-1.5 ${tok.statLabel}`}>
                      {s.label}
                    </span>
                    <span
                      className={`text-[1.3rem] font-[900] leading-none tracking-tight ${tok.statValue[s.idx]}`}
                      style={{ fontFamily: "'Outfit','Inter',sans-serif" }}
                    >
                      <AnimatedNumber value={s.val} decimals={s.dec} prefix={s.pfx} suffix={s.sfx} />
                    </span>
                  </div>
                </div>
                {i < stats.length - 1 && (
                  <div className={`h-px mx-5 border-t ${tok.divider}`} />
                )}
              </React.Fragment>
            ))}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
