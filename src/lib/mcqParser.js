/**
 * MCQKash Robust Parser — ported from NoteKash v8.246c
 * Handles bulk paste of MCQs from NoteKash, exams, and plain text.
 *
 * Tag Normalization Rules:
 *   #living_world, #Living_World, #LIVING_WORLD → "Living world"
 *   (capitalize first word only, underscore → space)
 */

// ─── Tag Utilities ───────────────────────────────────────────────────────────

/**
 * Normalize a raw tag string (from #tag or #tag_name) into display form.
 * "LIVING_WORLD" → "Living world"
 */
export function normalizeTag(raw) {
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase());
}

/**
 * Extract #tags from a block of text.
 * Returns { tags: string[], cleanText: string }
 */
export function extractTags(text) {
  const tags = [];
  const tagRegex = /#([\w_]+)/g;
  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    const normalized = normalizeTag(match[1]);
    if (!tags.includes(normalized)) tags.push(normalized);
  }
  const cleanText = text;
  return { tags, cleanText };
}

// ─── Core Parser (NoteKash-ported) ───────────────────────────────────────────

const STRIP_OPTION_MARKER =
  /^\s*(?:[\[\(]\s*[a-zA-Z0-9iIvVxX]+\s*[\]\)]\.?|[a-zA-Z][\.\)\-\:]|[a-eA-E]\s+|[\u2022\u25E6\u25AA\u25CF\u25CB\u2023•◦▪●○‣\-\*]|\d+[\.\)])\s*/;

const LETTER_OPTION   = /^\s*(?:[\[\(]\s*[a-zA-Z]\s*[\]\)]|[a-zA-Z][\.\)\-\:]|[a-eA-E]\s+)(?=\s|\d|$)/;
const ROMAN_OPTION    = /^\s*(?:[\[\(]\s*[iIvVxX]+\s*[\]\)]|[iIvVxX]+\s*[\.\)\-])(?:\s+|$)/;
const BULLET_OPTION   = /^\s*[\u2022\u25E6\u25AA\u25CF\u25CB\u2023•◦▪●○‣\-\*]\s+/;
const NUMBER_BRACKET  = /^\s*[\[\(]\s*\d+\s*[\]\)]\.?\s+/;
const NUMBERED_STMT   = /^\s*\d+[\.\)]\s+(?!\s*only\s|\s*all\s|\s*none\s|\s*both\s)/i;

function isOptionLine(line) {
  return (
    LETTER_OPTION.test(line) ||
    ROMAN_OPTION.test(line) ||
    NUMBER_BRACKET.test(line) ||
    BULLET_OPTION.test(line)
  );
}

function finalizeBlock({ qLines, oLines, explanation, correctAnswerLabel }) {
  const NUMBERED_STATEMENT_RE = /^\s*\d+[\.\)]\s+(?!\s*only\s|\s*all\s|\s*none\s|\s*both\s)/i;

  let cleanQLines = [...(qLines || [])];

  // Strip leading question number / metadata
  while (cleanQLines.length > 0) {
    const line = cleanQLines[0].trim();
    if (!line) { cleanQLines.shift(); continue; }
    if (NUMBERED_STATEMENT_RE.test(line)) break;
    const isMetadata = /^(MCQ|Question|Q)?[\d\s\.:)]+$/i.test(line);
    if (isMetadata) { cleanQLines.shift(); continue; }
    const leadingMarker = /^(MCQ|Question|Q)?\s*\d+[\.:)]\s*/i;
    if (leadingMarker.test(line)) {
      cleanQLines[0] = line.replace(leadingMarker, '').trim();
    }
    break;
  }

  const cleanQ = cleanQLines.join('\n').trim();

  const cleanOptions = (oLines || [])
    .map(o => (typeof o === 'string' ? o.replace(STRIP_OPTION_MARKER, '').trim() : ''))
    .filter(o => o.length > 0);

  if (cleanOptions.length < 2) {
    if (cleanOptions.length === 1 && cleanOptions[0].includes(',')) {
      const split = cleanOptions[0].split(',').map(s => s.trim()).filter(Boolean);
      if (split.length >= 2) return { question: cleanQ, options: split, explanation, correctAnswerLabel };
    }
    return null;
  }

  return { question: cleanQ, options: cleanOptions, explanation, correctAnswerLabel };
}

function parseSingleMcq(text) {
  const allLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (allLines.length < 2) return null;

  let parsedExplanationLines = [];
  let parsedAnswerStr = null;
  let mcqLinesEndIndex = allLines.length;
  let inExplanationZone = false;

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];

    const ansMatch = line.match(
      /^(?:Correct\s+Answer|Answer|Ans)[\s\:\-]+([a-eA-E]|[1-5])(?:\s|$|\.)/i
    );
    if (ansMatch && !inExplanationZone) {
      let raw = ansMatch[1].trim().toUpperCase();
      // Convert 1-5 to A-E
      const numMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
      parsedAnswerStr = numMap[raw] || raw;
      if (i < mcqLinesEndIndex) mcqLinesEndIndex = i;
      continue;
    }

    const expMatch = line.match(/^(?:Explanation|Exp|Solution|Sol)[\s\:\-]*(.*)/i);
    if (expMatch && !inExplanationZone) {
      inExplanationZone = true;
      if (i < mcqLinesEndIndex) mcqLinesEndIndex = i;
      const firstLineExp = expMatch[1].trim();
      if (firstLineExp) parsedExplanationLines.push(firstLineExp);
      continue;
    }

    if (inExplanationZone) {
      const ansInExp = line.match(
        /^(?:Correct\s+Answer|Answer|Ans)[\s\:\-]+([a-eA-E]|[1-5])(?:\s|$|\.)/i
      );
      if (ansInExp) {
        let raw = ansInExp[1].trim().toUpperCase();
        const numMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
        parsedAnswerStr = numMap[raw] || raw;
      } else {
        parsedExplanationLines.push(line);
      }
    }
  }

  let lines = allLines.slice(0, mcqLinesEndIndex);
  if (lines.length < 2) {
    lines = allLines;
    parsedExplanationLines = [];
    parsedAnswerStr = null;
  }

  // Bottom-up option scan
  let optionsStartIndex = -1;
  let consecutiveOptions = 0;
  let lastOptionType = null;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    let currentType = null;
    if (LETTER_OPTION.test(line)) currentType = 'letter';
    else if (ROMAN_OPTION.test(line)) currentType = 'roman';
    else if (NUMBER_BRACKET.test(line)) currentType = 'number_bracket';
    else if (BULLET_OPTION.test(line)) currentType = 'bullet';

    if (currentType) {
      if (lastOptionType === null || lastOptionType === currentType) {
        consecutiveOptions++;
        optionsStartIndex = i;
        lastOptionType = currentType;
      } else {
        if (consecutiveOptions >= 2) break;
        consecutiveOptions = 1;
        optionsStartIndex = i;
        lastOptionType = currentType;
      }
    } else {
      if (consecutiveOptions >= 2) break;
      if (consecutiveOptions === 1) {
        if (NUMBERED_STMT.test(line)) break;
        consecutiveOptions = 0;
        optionsStartIndex = -1;
        lastOptionType = null;
      }
    }
  }

  let questionLines = [];
  let optionLines = [];

  if (optionsStartIndex > 0 && consecutiveOptions >= 2) {
    questionLines = lines.slice(0, optionsStartIndex);
    optionLines = lines.slice(optionsStartIndex);
  } else {
    // Fallback: look for letter options
    const letterIndices = lines.reduce((acc, line, idx) => {
      if (LETTER_OPTION.test(line)) acc.push(idx);
      return acc;
    }, []);
    if (letterIndices.length >= 2) {
      questionLines = lines.slice(0, letterIndices[0]);
      optionLines = lines.slice(letterIndices[0]);
    } else {
      const bulletIndices = lines.reduce((acc, line, idx) => {
        if (BULLET_OPTION.test(line)) acc.push(idx);
        return acc;
      }, []);
      if (bulletIndices.length >= 2) {
        questionLines = lines.slice(0, bulletIndices[0]);
        optionLines = lines.slice(bulletIndices[0]);
      } else {
        questionLines = [lines[0]];
        optionLines = lines.slice(1);
      }
    }
  }

  if (!questionLines.length || !optionLines.length) return null;

  return finalizeBlock({
    qLines: questionLines,
    oLines: optionLines,
    explanation: parsedExplanationLines.length > 0 ? parsedExplanationLines.join('\n') : null,
    correctAnswerLabel: parsedAnswerStr,
  });
}

function mergeChunksByOptions(chunks) {
  const merged = [];
  let accumulator = '';

  chunks.forEach(chunk => {
    const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
    const hasOptions = lines.some(l => {
      return (
        LETTER_OPTION.test(l) ||
        ROMAN_OPTION.test(l) ||
        NUMBER_BRACKET.test(l) ||
        BULLET_OPTION.test(l)
      );
    });

    const hasAnswer = /^(?:Correct\s+Answer|Answer|Ans)[\s\:\-]+/im.test(chunk) || /^(?:Explanation|Exp|Solution|Sol)[\s\:\-]*/im.test(chunk);

    if (hasOptions || hasAnswer) {
      merged.push((accumulator + '\n\n' + chunk).trim());
      accumulator = '';
    } else {
      accumulator = (accumulator + '\n\n' + chunk).trim();
    }
  });

  if (accumulator && merged.length > 0) {
    merged[merged.length - 1] = (merged[merged.length - 1] + '\n\n' + accumulator).trim();
  }

  return merged.length > 0 ? merged : [accumulator];
}

/**
 * Main bulk parser — handles up to 50+ MCQs pasted at once.
 * Supports NoteKash separators (>>>, ---, ***, ___) AND numbered blocks.
 *
 * Returns an array of parsed MCQ objects ready for Supabase insertion.
 */
export function parseBulkMCQText(rawText) {
  // Pre-process
  let cleanText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();

  if (!cleanText) return [];

  const results = [];

  // 1. Try explicit separators (NoteKash style)
  const SEPARATOR_REGEX = /(?:^|\n)\s*(?:>>>|---|___|(?<!\*)\*{3}(?!\*))\s*(?:\n|$)/;
  if (SEPARATOR_REGEX.test(cleanText)) {
    const chunks = cleanText.split(SEPARATOR_REGEX).filter(c => c.trim().length > 0);
    chunks.forEach(chunk => {
      const { tags, cleanText: ct } = extractTags(chunk.trim());
      const parsed = parseSingleMcq(ct);
      if (parsed) results.push({ ...parsed, tags });
    });
    if (results.length > 0) return _buildMCQObjects(results);
  }

  // 2. Try numbered MCQ splitting (1. ... 2. ... 3. ...)
  const NUMBERED_BLOCK_REGEX = /(?=(?:^|\n)\s*(?:Q\s*\d+[\.:)]|\d+[\.:)])\s)/i;
  const rawNumberedChunks = cleanText.split(NUMBERED_BLOCK_REGEX).filter(c => c.trim().length > 0);
  if (rawNumberedChunks.length > 1) {
    const numberedChunks = mergeChunksByOptions(rawNumberedChunks);
    if (numberedChunks.length > 1) {
      numberedChunks.forEach(chunk => {
        const { tags, cleanText: ct } = extractTags(chunk.trim());
        const parsed = parseSingleMcq(ct);
        if (parsed) results.push({ ...parsed, tags });
      });
      if (results.length > 0) return _buildMCQObjects(results);
    }
  }

  // 3. Try double-newline splitting
  const rawDoubleChunks = cleanText.split(/\n\s*\n/).filter(c => c.trim().length > 0);
  if (rawDoubleChunks.length > 1) {
    const doubleChunks = mergeChunksByOptions(rawDoubleChunks);
    if (doubleChunks.length > 1) {
      doubleChunks.forEach(chunk => {
        const { tags, cleanText: ct } = extractTags(chunk.trim());
        const parsed = parseSingleMcq(ct);
        if (parsed) results.push({ ...parsed, tags });
      });
      if (results.length > 0) return _buildMCQObjects(results);
    }
  }

  // 4. Fallback: treat entire text as single MCQ
  const { tags, cleanText: ct } = extractTags(cleanText);
  const parsed = parseSingleMcq(ct);
  if (parsed) results.push({ ...parsed, tags });

  return _buildMCQObjects(results);
}

function _buildMCQObjects(rawParsed) {
  return rawParsed.map(block => {
    const labels = ['a', 'b', 'c', 'd', 'e'];
    const options = (block.options || []).slice(0, 5).map((text, i) => ({
      id: labels[i],
      label: labels[i].toUpperCase(),
      text: text.trim(),
    }));

    let correctId = 'a';
    if (block.correctAnswerLabel) {
      const label = block.correctAnswerLabel.toUpperCase();
      const numMap = { '1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e' };
      correctId = (numMap[label] || label.toLowerCase()) || 'a';
    }

    return {
      id: 'temp_' + Math.random().toString(36).substr(2, 9),
      question: block.question,
      options,
      correctId,
      explanation: block.explanation || '',
      tags: block.tags || [],
    };
  });
}
