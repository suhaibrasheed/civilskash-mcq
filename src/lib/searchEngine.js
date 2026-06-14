import { 
  User, Bookmark, Zap, Terminal, Sparkles, Flame, Coins,
  Briefcase, Landmark, Cpu, Globe, BookOpen, Target, Activity,
  Database, Map as MapIcon, Gavel, Calculator, Shield, Book,
  Layers, FileText, Compass
} from 'lucide-react';
import { EXAM_SERIES } from './exams';
import { ALL_STATIC_BANKS_SYNC } from './dataHub';

export const SUBJECT_ICONS = {
  'accountancy':         Briefcase,
  'ancient-history':     Landmark,
  'computer-awareness':  Cpu,
  'current-affairs':     Globe,
  'english':             BookOpen,
  'environment':         Target,
  'general-science':     Activity,
  'indian-economy':      Database,
  'indian-geography':    MapIcon,
  'indian-polity':       Gavel,
  'maths':               Calculator,
  'medieval-history':    Shield,
  'modern-history':      Book,
  'physical-geography':  Globe,
  'reasoning':           Layers,
  'static-gk':           FileText,
  'world-geography':     MapIcon,
  'jk-affairs':          Globe,
};

export const SUBJECT_COLORS = {
  'maths': '#f59e0b',
  'general-science': '#10b981',
  'indian-polity': '#4361ee',
  'current-affairs': '#ef4444',
  'computer-awareness': '#06b6d4',
  'english': '#a78bfa',
  'indian-economy': '#f97316',
};

export const CATEGORIES = [
  { name: 'Accountancy', slug: 'accountancy' },
  { name: 'Ancient History', slug: 'ancient-history' },
  { name: 'Computer Awareness', slug: 'computer-awareness' },
  { name: 'Current Affairs', slug: 'current-affairs' },
  { name: 'English', slug: 'english' },
  { name: 'Environment', slug: 'environment' },
  { name: 'General Science', slug: 'general-science' },
  { name: 'Indian Economy', slug: 'indian-economy' },
  { name: 'Indian Geography', slug: 'indian-geography' },
  { name: 'Indian Polity', slug: 'indian-polity' },
  { name: 'JK Affairs', slug: 'jk-affairs' },
  { name: 'Maths', slug: 'maths' },
  { name: 'Medieval History', slug: 'medieval-history' },
  { name: 'Modern History', slug: 'modern-history' },
  { name: 'Physical Geography', slug: 'physical-geography' },
  { name: 'Reasoning', slug: 'reasoning' },
  { name: 'Static GK', slug: 'static-gk' },
  { name: 'World Geography', slug: 'world-geography' },
];

export const COMMANDS = [
  {
    code: '/profile',
    title: 'Go to Profile',
    description: 'View dashboard, performance charts, and war room analytics.',
    icon: User,
    color: '#34d399',
    to: '/profile'
  },
  {
    code: '/bookmarks',
    title: 'Saved Bookmarks',
    description: 'Review saved questions and flashcards.',
    icon: Bookmark,
    color: '#f59e0b',
    to: '/bookmarks'
  },
  {
    code: '/resurrect',
    title: 'Rank Booster',
    description: 'Practice engine focused on correcting past failed mistakes.',
    icon: Zap,
    color: '#ef4444',
    to: '/resurrection'
  },
  {
    code: '/theme',
    title: 'Change UI Theme',
    description: 'Toggle theme modes and customize brand accents.',
    icon: Sparkles,
    color: '#06b6d4',
    action: 'theme'
  },
  {
    code: '/streak',
    title: 'Streak Multiplier',
    description: 'Check active learning streak and daily multipliers.',
    icon: Flame,
    color: '#f97316',
    action: 'streak'
  },
  {
    code: '/coins',
    title: 'Kash Vault',
    description: 'Inspect earned Kash coins balance and rewards store.',
    icon: Coins,
    color: '#fbbf24',
    action: 'coins'
  }
];

export const formatCategoryName = (slug) => {
  if (!slug) return '';
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

/**
 * Perform realtime fuzzy filtering across Exams, Subjects, Questions, Commands, and Tags
 * @param {string} query
 * @returns {object} { commands, exams, subjects, tags, questions }
 */
export const getFilteredResults = (query) => {
  const q = query.toLowerCase().trim();
  
  // Commands matching
  const matchedCommands = COMMANDS.filter(cmd => 
    cmd.code.toLowerCase().includes(q) || 
    cmd.title.toLowerCase().includes(q) || 
    cmd.description.toLowerCase().includes(q)
  ).map(c => ({ ...c, type: 'command', id: c.code }));
  
  // Exams matching
  const matchedExams = EXAM_SERIES.filter(exam => 
    exam.name.toLowerCase().includes(q)
  ).map(e => ({ ...e, type: 'exam', id: e.id }));
  
  // Subjects matching
  const matchedSubjects = CATEGORIES.filter(cat => 
    cat.name.toLowerCase().includes(q) || 
    cat.slug.toLowerCase().includes(q)
  ).map(s => ({ ...s, type: 'subject', id: s.slug }));
  
  // Unique Tags extraction
  const allTagsMap = new Map();
  ALL_STATIC_BANKS_SYNC.forEach(question => {
    if (Array.isArray(question.tags)) {
      question.tags.forEach(tag => {
        const cleanTag = tag.trim();
        const lower = cleanTag.toLowerCase();
        if (!allTagsMap.has(lower)) {
          allTagsMap.set(lower, { name: cleanTag, count: 0, category: question.category_id });
        }
        allTagsMap.get(lower).count += 1;
      });
    }
  });
  const uniqueTags = Array.from(allTagsMap.values());
  const matchedTags = uniqueTags.filter(tag => 
    tag.name.toLowerCase().includes(q)
  ).sort((a, b) => b.count - a.count)
   .map(t => ({ ...t, type: 'tag', id: 'tag-' + t.name }));
   
  // Questions matching
  const matchedQuestions = ALL_STATIC_BANKS_SYNC.filter(question => 
    question.question.toLowerCase().includes(q) || 
    (question.explanation && question.explanation.toLowerCase().includes(q)) || 
    question.options.some(opt => opt.text.toLowerCase().includes(q)) || 
    (Array.isArray(question.tags) && question.tags.some(tag => tag.toLowerCase().includes(q)))
  ).map(q => ({ ...q, type: 'question', id: q.id }));
  
  return {
    commands: matchedCommands,
    exams: matchedExams,
    subjects: matchedSubjects,
    tags: matchedTags,
    questions: matchedQuestions
  };
};
