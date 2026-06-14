import React from 'react';

// Gradient definitions helper to ensure unique IDs for gradients across avatars
const AvatarGradients = () => (
  <svg style={{ height: 0, width: 0, position: 'absolute' }} aria-hidden="true">
    <defs>
      <linearGradient id="avGrad-1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4f46e5" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <linearGradient id="avGrad-2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#e11d48" />
      </linearGradient>
      <linearGradient id="avGrad-3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="avGrad-4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="avGrad-5" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="avGrad-6" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#f43f5e" />
      </linearGradient>
      <linearGradient id="avGrad-7" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14b8a6" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
      <linearGradient id="avGrad-8" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <linearGradient id="avGrad-9" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="avGrad-10" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#4338ca" />
      </linearGradient>
    </defs>
  </svg>
);

// SVG Avatars Definitions
export const avatarsList = [
  // MALE AVATARS (1 - 5)
  {
    id: 1,
    gender: 'male',
    name: 'Hipster Geek',
    component: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="48" fill="url(#avGrad-1)" />
        {/* Face */}
        <circle cx="50" cy="48" r="22" fill="#ffd1a9" />
        {/* Neck */}
        <path d="M44 64h12v12H44z" fill="#ffd1a9" />
        {/* Hair */}
        <path d="M28 42c0-14 10-20 22-20s22 6 22 20c0 4-4 4-8 1s-6-3-14-3-10 0-14 3-8 3-8-1z" fill="#2d3748" />
        {/* Glasses */}
        <rect x="36" y="42" width="11" height="9" rx="2" fill="none" stroke="#1a202c" strokeWidth="2" />
        <rect x="53" y="42" width="11" height="9" rx="2" fill="none" stroke="#1a202c" strokeWidth="2" />
        <line x1="47" y1="46" x2="53" y2="46" stroke="#1a202c" strokeWidth="2" />
        {/* Shirt */}
        <path d="M24 85c0-12 12-16 26-16s26 4 26 16H24z" fill="#ffffff" />
        <path d="M42 69l8 12 8-12H42z" fill="#2b6cb0" />
      </svg>
    ),
  },
  {
    id: 2,
    gender: 'male',
    name: 'Smart Scholar',
    component: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="48" fill="url(#avGrad-2)" />
        {/* Neck */}
        <path d="M45 64h10v14H45z" fill="#e0a98c" />
        {/* Face */}
        <circle cx="50" cy="47" r="21" fill="#f3c1a3" />
        {/* Hair with side sweep */}
        <path d="M29 40c0-12 8-18 21-18s21 6 21 16c0 3-3 3-7 1s-5-2-14-2c-10 0-11 4-15 4s-6-1-6-1z" fill="#744210" />
        {/* Glasses */}
        <circle cx="39" cy="46" r="5" fill="none" stroke="#2d3748" strokeWidth="2" />
        <circle cx="61" cy="46" r="5" fill="none" stroke="#2d3748" strokeWidth="2" />
        <line x1="44" y1="46" x2="56" y2="46" stroke="#2d3748" strokeWidth="2" />
        {/* Smile */}
        <path d="M45 57c2 2.5 8 2.5 10 0" fill="none" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" />
        {/* Clothes */}
        <path d="M26 84c4-12 11-15 24-15s20 3 24 15H26z" fill="#2d3748" />
        <path d="M45 69h10v10H45z" fill="#e53e3e" />
      </svg>
    ),
  },
  {
    id: 3,
    gender: 'male',
    name: 'Active Athlete',
    component: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="48" fill="url(#avGrad-3)" />
        {/* Neck */}
        <path d="M44 65h12v12H44z" fill="#d4a373" />
        {/* Face */}
        <circle cx="50" cy="46" r="22" fill="#e9c46a" />
        {/* Hair - Short spiky */}
        <path d="M28 35l4-8 8-4 10 2 10-2 8 4 4 8-3 3c-5-4-9-4-19-4s-14 2-19 4l-3-3z" fill="#1a202c" />
        {/* Headband */}
        <rect x="27" y="34" width="46" height="5" fill="#e63946" rx="1" />
        {/* Eyes */}
        <circle cx="39" cy="46" r="2" fill="#1a202c" />
        <circle cx="61" cy="46" r="2" fill="#1a202c" />
        {/* Mouth */}
        <path d="M46 56h8" stroke="#1a202c" strokeWidth="2" strokeLinecap="round" />
        {/* Sport Jacket */}
        <path d="M23 85c0-11 11-16 27-16s27 5 27 16H23z" fill="#1d3557" />
        <path d="M48 69h4v16h-4z" fill="#e63946" />
      </svg>
    ),
  },
  {
    id: 4,
    gender: 'male',
    name: 'Sleek Executive',
    component: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="48" fill="url(#avGrad-4)" />
        {/* Neck */}
        <path d="M45 64h10v14H45z" fill="#dfb195" />
        {/* Face */}
        <circle cx="50" cy="47" r="21" fill="#f0c4ab" />
        {/* Hair - Clean combed */}
        <path d="M30 36c0-12 10-16 20-16s20 4 20 16c0 1-5 0-9-2s-6-1-11-1-10 3-20 3z" fill="#2c3e50" />
        {/* Beard outline */}
        <path d="M29 47c1 10 9 17 21 17s20-7 21-17h-4c-1 6-7 13-17 13s-16-7-17-13h-4z" fill="#4a5568" />
        {/* Eyes */}
        <circle cx="41" cy="46" r="2" fill="#2c3e50" />
        <circle cx="59" cy="46" r="2" fill="#2c3e50" />
        {/* Suit & Tie */}
        <path d="M25 85c0-12 10-17 25-17s25 5 25 17H25z" fill="#1a202c" />
        <path d="M44 68l6 10 6-10H44z" fill="#ffffff" />
        <path d="M48 74l2 11 2-11h-4z" fill="#3182ce" />
      </svg>
    ),
  },
  {
    id: 5,
    gender: 'male',
    name: 'Tech Wizard',
    component: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="48" fill="url(#avGrad-5)" />
        {/* Neck */}
        <path d="M44 65h12v12H44z" fill="#ffd1a9" />
        {/* Face */}
        <circle cx="50" cy="48" r="22" fill="#ffd1a9" />
        {/* Beanie Cap */}
        <path d="M27 42c0-13 10-18 23-18s23 5 23 18H27z" fill="#2d3748" />
        <ellipse cx="50" cy="24" rx="4" ry="4" fill="#dd6b20" />
        {/* Eyes */}
        <circle cx="39" cy="48" r="2.5" fill="#2d3748" />
        <circle cx="61" cy="48" r="2.5" fill="#2d3748" />
        {/* Beard stubble */}
        <path d="M34 56c4 6 10 8 16 8s12-2 16-8H60c-2 3-6 5-10 5s-8-2-10-5h-6z" fill="#718096" />
        {/* Hoodie shirt */}
        <path d="M24 85c0-11 11-16 26-16s26 5 26 16H24z" fill="#dd6b20" />
        <path d="M38 69l12 7 12-7-12 16-12-16z" fill="#4a5568" />
      </svg>
    ),
  },
  // FEMALE AVATARS (6 - 10)
  {
    id: 6,
    gender: 'female',
    name: 'Creative Designer',
    component: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="48" fill="url(#avGrad-6)" />
        {/* Hair back */}
        <circle cx="34" cy="50" r="12" fill="#1a202c" />
        <circle cx="66" cy="50" r="12" fill="#1a202c" />
        {/* Neck */}
        <path d="M45 64h10v14H45z" fill="#ffd1a9" />
        {/* Face */}
        <circle cx="50" cy="47" r="21" fill="#ffe0bd" />
        {/* Hair front/bangs */}
        <path d="M29 42c0-11 9-17 21-17s21 6 21 17c0 2-4 0-8-2s-6-3-13-3-9 3-13 3-8 2-8-1z" fill="#1a202c" />
        {/* Headphones band */}
        <path d="M32 36c5-10 15-13 18-13s13 3 18 13" fill="none" stroke="#d53f8c" strokeWidth="3.5" />
        <rect x="26" y="38" width="6" height="14" rx="2" fill="#d53f8c" />
        <rect x="68" y="38" width="6" height="14" rx="2" fill="#d53f8c" />
        {/* Eyes with eyelashes */}
        <path d="M35 47c1-2 5-2 6 0" fill="none" stroke="#1a202c" strokeWidth="2" strokeLinecap="round" />
        <path d="M59 47c1-2 5-2 6 0" fill="none" stroke="#1a202c" strokeWidth="2" strokeLinecap="round" />
        {/* Smile */}
        <path d="M44 57c2 2 8 2 10 0" fill="none" stroke="#1a202c" strokeWidth="2" strokeLinecap="round" />
        {/* Clothes */}
        <path d="M25 85c0-11 10-15 25-15s25 4 25 15H25z" fill="#4a5568" />
        <circle cx="50" cy="79" r="6" fill="#fff" />
      </svg>
    ),
  },
  {
    id: 7,
    gender: 'female',
    name: 'Smart Scientist',
    component: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="48" fill="url(#avGrad-7)" />
        {/* Hair back */}
        <path d="M25 40c0 18 6 28 6 28h38s6-10 6-28-11-20-25-20-25 2-25 20z" fill="#805ad5" />
        {/* Neck */}
        <path d="M45 64h10v14H45z" fill="#e0a98c" />
        {/* Face */}
        <circle cx="50" cy="46" r="21" fill="#f3c1a3" />
        {/* Hair bangs */}
        <path d="M29 36c3-6 11-10 21-10s18 4 21 10c0 0-4-3-8-3s-6 1-13 1-9-1-13-1-8 3-8 3z" fill="#805ad5" />
        {/* Glasses */}
        <rect x="34" y="42" width="13" height="8" rx="2" fill="none" stroke="#1a202c" strokeWidth="2" />
        <rect x="53" y="42" width="13" height="8" rx="2" fill="none" stroke="#1a202c" strokeWidth="2" />
        <line x1="47" y1="46" x2="53" y2="46" stroke="#1a202c" strokeWidth="2" />
        {/* Blush */}
        <circle cx="34" cy="52" r="2" fill="#f56565" opacity="0.5" />
        <circle cx="66" cy="52" r="2" fill="#f56565" opacity="0.5" />
        {/* Clothes */}
        <path d="M25 85c0-11 10-15 25-15s25 4 25 15H25z" fill="#edf2f7" />
        <path d="M44 70l6 8 6-8H44z" fill="#319795" />
      </svg>
    ),
  },
  {
    id: 8,
    gender: 'female',
    name: 'Sleek Leader',
    component: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="48" fill="url(#avGrad-8)" />
        {/* Neck */}
        <path d="M45 64h10v14H45z" fill="#ffd1a9" />
        {/* Face */}
        <circle cx="50" cy="47" r="21" fill="#ffd1a9" />
        {/* Hair - sleek bob cut */}
        <path d="M26 35c0 0 1 18 3 24s6 4 6 4 2-10 2-16c0-6 4-15 13-15s15 9 15 15c0 6 2 16 2 16s4 2 6-4 3-24 3-24-9-17-25-17-25 17-25 17z" fill="#2d3748" />
        {/* Eyes */}
        <path d="M37 47c1-1 4-1 5 0" fill="none" stroke="#1a202c" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M58 47c1-1 4-1 5 0" fill="none" stroke="#1a202c" strokeWidth="2.5" strokeLinecap="round" />
        {/* Smile */}
        <path d="M44 57c2 2 8 2 10 0" fill="none" stroke="#e53e3e" strokeWidth="2.5" strokeLinecap="round" />
        {/* Professional Suit */}
        <path d="M24 85c0-12 11-16 26-16s26 4 26 16H24z" fill="#1a202c" />
        <path d="M43 69l7 10 7-10H43z" fill="#ecc94b" />
      </svg>
    ),
  },
  {
    id: 9,
    gender: 'female',
    name: 'Energetic Creator',
    component: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="48" fill="url(#avGrad-9)" />
        {/* Space buns */}
        <circle cx="30" cy="28" r="9" fill="#dd6b20" />
        <circle cx="70" cy="28" r="9" fill="#dd6b20" />
        {/* Neck */}
        <path d="M45 64h10v14H45z" fill="#ffd1a9" />
        {/* Face */}
        <circle cx="50" cy="48" r="21" fill="#ffe0bd" />
        {/* Hair front */}
        <path d="M29 44c0-10 9-16 21-16s21 6 21 16c0 1-4-1-8-3s-6-1-13-1-9 1-13 1-8 2-8 2z" fill="#dd6b20" />
        {/* Eyes */}
        <circle cx="39" cy="47" r="2.5" fill="#2d3748" />
        <circle cx="61" cy="47" r="2.5" fill="#2d3748" />
        {/* Smile - open smile */}
        <path d="M43 56c1 4 6 5 7 5s6-1 7-5" fill="#fff" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" />
        {/* Clothes */}
        <path d="M25 85c0-11 10-15 25-15s25 4 25 15H25z" fill="#4c51bf" />
        <path d="M40 70l10 7 10-7-10 15L40 70z" fill="#e2e8f0" />
      </svg>
    ),
  },
  {
    id: 10,
    gender: 'female',
    name: 'Zen Minimalist',
    component: ({ className }) => (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="48" fill="url(#avGrad-10)" />
        {/* Bun hair */}
        <circle cx="50" cy="23" r="10" fill="#7b341e" />
        {/* Neck */}
        <path d="M45 64h10v14H45z" fill="#ffd1a9" />
        {/* Face */}
        <circle cx="50" cy="48" r="21" fill="#ffd1a9" />
        {/* Sleek straight hair bangs */}
        <path d="M29 39c0 0 2 12 4 15s4-6 4-10c0 0 4-4 13-4s13 4 13 4 2 7 4 10 4-15 4-15-8-12-24-12-25 12-25 12z" fill="#7b341e" />
        {/* Closed Eyes */}
        <path d="M36 49c2 1.5 4 1.5 6 0" fill="none" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" />
        <path d="M58 49c2 1.5 4 1.5 6 0" fill="none" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" />
        {/* Soft Smile */}
        <path d="M45 57c2 1 8 1 10 0" fill="none" stroke="#2d3748" strokeWidth="2.5" strokeLinecap="round" />
        {/* Dress */}
        <path d="M25 85c0-11 10-15 25-15s25 4 25 15H25z" fill="#319795" />
      </svg>
    ),
  },
];

// Main rendering component that wraps the selected SVG avatar
export default function Avatar({ id = 1, className = "w-12 h-12" }) {
  const selected = avatarsList.find(a => a.id === Number(id)) || avatarsList[0];
  const Component = selected.component;
  return (
    <>
      <AvatarGradients />
      <Component className={className} />
    </>
  );
}
