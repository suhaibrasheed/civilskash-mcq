/**
 * Utility functions to classify and normalize question tags across MCQKash.
 * Tags come in three primary types:
 * 1. Topics: Start with '#' symbol (e.g. #financial_markets, #parliament, #physics, #jk_economy)
 * 2. PYQs: Enclosed in '[[]]' (e.g. [[JKSSB JA 2024]]), or starting with 'pyq:', or containing exam year patterns
 * 3. Difficulty Levels: #easy, #medium, #hard, #pro, easy, medium, hard, pro, hardcore
 */

export const isDifficultyTag = (tag) => {
  if (!tag) return false;
  const t = tag.toLowerCase().trim().replace(/^#/, '');
  return ['easy', 'medium', 'hard', 'pro', 'hardcore'].includes(t);
};

export const isPyqTag = (tag) => {
  if (!tag) return false;
  const t = tag.toLowerCase().trim();
  if (t.startsWith('pyq:') || t.startsWith('[[') || t.endsWith(']]')) return true;
  // Matches tags containing past year patterns e.g. "jkssb ja 2024", "upsc 2021" if not prefixed with '#'
  if (!t.startsWith('#') && /\b(20\d\d|19\d\d)\b/.test(t)) return true;
  return false;
};

export const isTopicTag = (tag) => {
  if (!tag) return false;
  const t = tag.toLowerCase().trim();
  if (isDifficultyTag(t) || isPyqTag(t)) return false;
  // Topics start with '#' or are non-PYQ/non-difficulty topic names
  return t.startsWith('#') || (!t.startsWith('pyq:') && !t.startsWith('[') && !/\b(20\d\d|19\d\d)\b/.test(t));
};

export const cleanTopicName = (tag) => {
  if (!tag) return '';
  const rawClean = tag
    .replace(/^pyq:\s*/i, '')
    .replace(/^#/, '')
    .replace(/^\[\[/, '')
    .replace(/\]\]$/, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .trim();
  return rawClean.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};
