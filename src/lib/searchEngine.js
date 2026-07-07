import { 
  User, Bookmark, Zap, Terminal, Sparkles, Flame, Coins,
  Briefcase, Landmark, Cpu, Globe, BookOpen, Target, Activity,
  Database, Map as MapIcon, Gavel, Calculator, Shield, Book,
  Layers, FileText, Compass, Search,
  BarChart2, GraduationCap, MessageCircle, Brain, FlaskConical, 
  Crosshair, Eye, Swords, Wand2, Award
} from 'lucide-react';
import { EXAM_SERIES } from './exams';
import { ALL_STATIC_BANKS_SYNC } from './dataHub';

export const SUBJECT_ICONS = {
  'accountancy':         Briefcase,
  'ancient-history':     Landmark,
  'art-culture':         Landmark,
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
  'accountancy':         '#f97316',
  'ancient-history':     '#eab308',
  'art-culture':         '#eab308',
  'computer-awareness':  '#dc2626',
  'current-affairs':     '#7c3aed',
  'english':             '#dc2626',
  'environment':         '#d946ef',
  'general-science':     '#d946ef',
  'indian-economy':      '#f97316',
  'indian-geography':    '#10b981',
  'indian-polity':       '#7c3aed',
  'maths':               '#00b4d8',
  'medieval-history':    '#eab308',
  'modern-history':      '#eab308',
  'physical-geography':  '#10b981',
  'reasoning':           '#00b4d8',
  'static-gk':           '#2563eb',
  'world-geography':     '#10b981',
  'jk-affairs':          '#2563eb',
};

export const CATEGORIES = [
  { name: 'Accountancy', slug: 'accountancy' },
  { name: 'Ancient History', slug: 'ancient-history' },
  { name: 'Art & Culture', slug: 'art-culture' },
  { name: 'Computer Awareness', slug: 'computer-awareness' },
  { name: 'Current Affairs', slug: 'current-affairs' },
  { name: 'English', slug: 'english' },
  { name: 'Environment', slug: 'environment' },
  { name: 'Science & Tech', slug: 'general-science' },
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
  },
  {
    code: '/battle',
    title: 'Battle Arena',
    description: 'Compete live with other aspirants in real-time MCQ battles.',
    icon: Swords,
    color: '#ec4899',
    to: '/battle-arena'
  },
  {
    code: '/leaderboard',
    title: 'Leaderboard',
    description: 'View global player rankings and top scorers.',
    icon: Award,
    color: '#fbbf24',
    to: '/leaderboard'
  },
  // Elite Features
  {
    code: '/detector',
    title: 'Rank Detector',
    description: 'Predict readiness, spot blindspots, and prevent exam day surprises.',
    icon: Target,
    color: '#f59e0b',
    isElite: true,
    to: '/profile'
  },
  {
    code: '/xray',
    title: 'X-Ray Analysis',
    description: 'Deep diagnostics beyond ordinary performance reports.',
    icon: Search,
    color: '#22d3ee',
    isElite: true,
    to: '/profile'
  },
  {
    code: '/intel',
    title: 'Exam Intel',
    description: 'Turn every attempt into actionable exam intelligence.',
    icon: BarChart2,
    color: '#818cf8',
    isElite: true,
    to: '/profile'
  },
  {
    code: '/coach',
    title: 'Personal Study Mentor',
    description: 'Get strategy, plans, mocks, and instant roadblock resolutions.',
    icon: GraduationCap,
    color: '#34d399',
    isElite: true,
    to: '/profile'
  },
  {
    code: '/tutor',
    title: 'AI Tutor',
    description: 'Master any MCQ instantly with crisp options breakdown.',
    icon: MessageCircle,
    color: '#fb7185',
    isElite: true,
    to: '/resurrection'
  },
  {
    code: '/explain',
    title: 'Smart Explainer',
    description: 'Grasp complex subjects with tailored explanations.',
    icon: Brain,
    color: '#fb923c',
    isElite: true,
    to: '/resurrection'
  },
  {
    code: '/forge',
    title: 'Mock Forge',
    description: 'Instantly assemble mocks from any combination of filters.',
    icon: Zap,
    color: '#c084fc',
    isElite: true,
    to: '/subject-mock/computer-awareness'
  },
  {
    code: '/smartmock',
    title: 'Smart Mock',
    description: 'Build AI-powered mocks from any topic or weak area.',
    icon: FlaskConical,
    color: '#2dd4bf',
    isElite: true,
    to: '/subject-mock/computer-awareness'
  },
  {
    code: '/notes',
    title: 'Smart Notes',
    description: 'Distill all misjudged MCQs into one revision cheat sheet.',
    icon: FileText,
    color: '#facc15',
    isElite: true,
    to: '/bookmarks'
  },
  {
    code: '/hunter',
    title: 'Gap Hunter',
    description: 'Redemption practice mocks automatically generated for low scores.',
    icon: Crosshair,
    color: '#fbbf24',
    isElite: true,
    to: '/resurrection'
  },
  {
    code: '/trap',
    title: 'Trap Finder',
    description: 'Simulation mocks that clone real test patterns to expose traps.',
    icon: Eye,
    color: '#a78bfa',
    isElite: true,
    to: '/resurrection'
  },
  {
    code: '/insights',
    title: 'Battle Insights',
    description: 'Expose tactical mistakes made during head-to-head live battles.',
    icon: Swords,
    color: '#f472b6',
    isElite: true,
    to: '/battle-arena'
  },
  {
    code: '/elitesuite',
    title: 'Elite AI Suite',
    description: 'Unlock the full power of your personalized AI study suite.',
    icon: Wand2,
    color: '#f59e0b',
    isElite: true,
    to: '/profile'
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
