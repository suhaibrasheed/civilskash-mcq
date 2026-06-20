import katex from 'katex';
import { getUserEconomy } from './db';

export async function queryGenerativeAI(systemPrompt, userPrompt, options = {}) {
  const provider = localStorage.getItem('civilsKash_aiProvider') || 'gemini';
  
  // Skip global injections for Admin / Creator Studio calls
  const isAdminCall = options.isAdmin || systemPrompt.includes("Creator Studio") || systemPrompt.includes("Passage Content Builder") || systemPrompt.includes("Question Improver") || systemPrompt.includes("Passage/Context Builder") || systemPrompt.includes("Bulk SubiParser Tag & PYQ Map Generator");

  if (!isAdminCall) {
    // Read target exam to contextualize prompt
    let targetExamContext = '';
    try {
      const economy = await getUserEconomy().catch(() => null);
      if (economy?.target_exam) {
        const examMap = {
          'upsc-pre': 'UPSC Prelims',
          'ssc-cgl': 'SSC CGL Tier 1',
          'state-pcs': 'State PSC Prelims'
        };
        const examName = examMap[economy.target_exam] || economy.target_exam;
        targetExamContext = `\n\n[CONTEXT] The user's Target Exam is "${examName}". Prioritize topics, depth, patterns, and contexts relevant to this syllabus where appropriate.`;
      }
    } catch (e) {
      console.warn("Failed to get target exam context in AI:", e);
    }

    // Inject target exam context to guide the generation (appends to systemPrompt)
    if (targetExamContext) {
      systemPrompt = `${systemPrompt}${targetExamContext}`;
    }

    const aiLang = localStorage.getItem('civilsKash_aiLanguage') || 'English';
    if (aiLang === 'Hinglish') {
      const isStructuredJson = systemPrompt.includes('JSON') || systemPrompt.includes('mcqs') || systemPrompt.includes('keywords') || systemPrompt.includes('highlights');
      // AI Tutor explanation JSON is structured, but we explicitly want to guide it to personalize the final fields in Hinglish with relevant humor, let's keep it safe.
      if (!isStructuredJson || systemPrompt.includes('Personal AI Tutor')) {
        const hinglishInstruction = `\n\n[CRITICAL] Deliver this response in slightly humorous Hinglish (Simple Hindi + Urdu + English). Use basic, highly conversational words written in the English alphabet (Latin script), mixed naturally with English technical terms. Make sure this version of Hinglish is extremely simple and easily understood by a wide general audience across India, Pakistan, and Bangladesh. Avoid complex, formal, or difficult Hindi/Sanskrit/Persian vocabulary. Add relatable, light-hearted humor and simple Hinglish memorization tricks (except for MCQs, which should remain purely academic).`;
        systemPrompt = `${systemPrompt}${hinglishInstruction}`;
      }
    }
  }

  let apiKey, apiUrl, headers, body;
  
  if (provider === 'gemini') {
    apiKey = localStorage.getItem('civilsKash_geminiKey');
    if (!apiKey) throw new Error("Google Gemini API key not set in settings.");
    const model = localStorage.getItem('civilsKash_geminiModel') || 'gemini-2.5-flash';
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    headers = { "Content-Type": "application/json" };
    body = JSON.stringify({ "contents": [{ "parts": [{ "text": `${systemPrompt}\n\n${userPrompt}` }] }] });
  } else if (provider === 'openai') {
    apiKey = localStorage.getItem('civilsKash_openaiKey');
    if (!apiKey) throw new Error("OpenAI API key not set in settings.");
    const model = localStorage.getItem('civilsKash_openaiModel') || 'gpt-4o-mini';
    apiUrl = "https://api.openai.com/v1/chat/completions";
    headers = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" };
    body = JSON.stringify({
      "model": model,
      "messages": [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userPrompt }]
    });
  } else if (provider === 'huggingface') {
    apiKey = localStorage.getItem('civilsKash_huggingfaceKey');
    if (!apiKey) throw new Error("Hugging Face API key not set in settings.");
    const model = localStorage.getItem('civilsKash_huggingfaceModel') || 'mistralai/Mistral-7B-Instruct-v0.2';
    apiUrl = `https://api-inference.huggingface.co/models/${model}`;
    headers = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" };
    const fullPrompt = `System: ${systemPrompt}\nUser: ${userPrompt}\nAssistant:`;
    body = JSON.stringify({
      "inputs": fullPrompt,
      "parameters": { "max_new_tokens": 1024, "return_full_text": false }
    });
  } else if (provider === 'deepseek') {
    apiKey = localStorage.getItem('civilsKash_deepseekKey');
    if (!apiKey) throw new Error("DeepSeek API key not set in settings.");
    const model = localStorage.getItem('civilsKash_deepseekModel') || 'deepseek-chat';
    apiUrl = "https://api.deepseek.com/chat/completions";
    headers = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" };
    body = JSON.stringify({
      "model": model,
      "messages": [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userPrompt }]
    });
  } else {
    // openrouter
    apiKey = localStorage.getItem('civilsKash_openrouterKey');
    if (!apiKey) throw new Error("OpenRouter API key not set in settings.");
    const model = localStorage.getItem('civilsKash_openrouterModel') || 'google/gemini-2.5-flash';
    apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": `${window.location.protocol}//${window.location.hostname}`,
      "X-Title": "MCQKash"
    };
    body = JSON.stringify({
      "model": model,
      "messages": [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userPrompt }]
    });
  }

  const response = await fetch(apiUrl, { method: "POST", headers, body });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Invalid API Key. Please verify in settings.");
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  let content = null;
  if (provider === 'gemini') {
    content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  } else if (provider === 'huggingface') {
    content = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
  } else {
    content = data?.choices?.[0]?.message?.content;
  }

  if (!content) throw new Error("AI returned empty or invalid response.");
  return content;
}

/**
 * Strips all markdown code fences from a string (```json, ```, etc.)
 * Call this BEFORE attempting JSON.parse on any AI response.
 */
export function stripCodeFences(text) {
  if (!text) return '';
  return text
    .trim()
    .replace(/^```[\w]*\n?/, '')   // opening fence
    .replace(/\n?```$/, '')         // closing fence
    .trim();
}

/**
 * Parses inline and block math delimiters and renders them to KaTeX HTML string.
 * Also converts any markdown tables to beautiful HTML tables.
 */
export function renderMathInHtmlString(htmlString) {
  if (!htmlString) return '';
  
  // Convert markdown tables first
  let result = convertMarkdownTablesToHtml(htmlString);
  
  result = result.replace(/\$\$(.*?)\$\$/gs, (match, math) => {
    try { return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false }); }
    catch (e) { return match; }
  });
  
  result = result.replace(/\\\[(.*?)\\\]/gs, (match, math) => {
    try { return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false }); }
    catch (e) { return match; }
  });
  
  result = result.replace(/\\\(({.*?}|.*?)\\\)/gs, (match, math) => {
    try { return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }); }
    catch (e) { return match; }
  });

  result = result.replace(/\$([^\$\n]{1,150})\$/g, (match, math) => {
    if (/^\d+([.,]\d+)?\s*(KashCoins|KC|million|billion|trillion)?\s*$/i.test(math.trim())) return match;
    try { return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }); }
    catch (e) { return match; }
  });
  
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-theme-text">$1</strong>');
  result = result.replace(/\*([^\*]+?)\*/g, '<em class="italic text-theme-text">$1</em>');
  return result;
}

/**
 * Queries AI for key terms/phrases to highlight in the explanation text(s)
 */
export async function queryColorHighlightsForExplanations(explanations) {
  const isArray = Array.isArray(explanations);
  const list = isArray ? explanations : [explanations];
  
  if (list.every(t => !t || !t.trim())) {
    return isArray ? list.map(() => []) : [];
  }

  const systemPrompt = `You are a text highlight designer for competitive exam study materials.
  Analyze the given explanation texts and identify critical keywords, concepts, dates, acts, laws, names, or statistics that should be highlighted.
  
  For each explanation text in the input list, you must provide a list of highlights.
  Return a compact keyword plan. The app will do the actual find-and-replace.
  Each highlight must map to one of these color categories:
  - 'red': for critical warnings, pitfalls, or essential definitions.
  - 'green': for positive outcomes, successful results, or core facts.
  - 'blue': for dates, acts, treaties, or names.
  - 'orange': for statistics, numbers, percentages, or secondary details.
  - 'magenta': for core themes or philosophical concepts.
  - 'teal': for geography, ecology, science terms, or institutions.
  
  Highlighting Rules:
  - Keep highlights short (usually 1-3 words).
  - Limit highlights to 3-5 key terms per explanation.
  - The keyword/phrase must match the text exactly (case-sensitive).
  - IMPORTANT: Distribute highlights dynamically across all 6 colors. Do not just use one or two colors (like blue or green) repeatedly; make the explanations vibrant and colorful by utilizing different categories where appropriate.
  
  Return ONLY a JSON object:
  {
    "keywords": [{ "text": "exact substring", "color": "blue", "explanationIndexes": [0, 2] }],
    "results": [{ "highlights": [{ "text": "exact substring", "color": "blue" }] }]
  }
  Do NOT wrap in markdown code blocks.`;

  const userPrompt = `Explanations to highlight:\n` + list.map((exp, i) => `[Explanation ${i}]:\n${exp}`).join('\n\n');

  try {
    const response = await queryGenerativeAI(systemPrompt, userPrompt);
    const cleanJson = stripCodeFences(response);
    const data = JSON.parse(cleanJson);
    if (Array.isArray(data.results)) {
      return isArray ? data.results.map(r => r?.highlights || []) : (data.results?.[0]?.highlights || []);
    }
    if (Array.isArray(data.keywords)) {
      const results = list.map((_, index) => data.keywords
        .filter(k => !Array.isArray(k.explanationIndexes) || k.explanationIndexes.includes(index))
        .map(k => ({ text: k.text, color: k.color })));
      return isArray ? results : (results[0] || []);
    }
    return isArray ? list.map(() => []) : [];
  } catch (e) {
    console.error("Failed to parse highlights from AI response:", e);
    return isArray ? list.map(() => []) : [];
  }
}

/**
 * Replaces exact case-insensitive matches of highlights in text with color span tags
 */
export function applyHighlightsToText(text, highlights) {
  if (!text) return '';
  if (!highlights || highlights.length === 0) return text;
  
  // Split text by LaTeX math equations so we don't apply highlighting inside formulas
  const latexRegex = /(\$\$[\s\S]*?\ $\$|\$[\s\S]*?\$|\\\(.*?\\\)|\\\[.*?\\\])/g;
  const segments = text.split(latexRegex);
  
  const sorted = [...highlights].sort((a, b) => (b.text || '').length - (a.text || '').length);
  
  const processedSegments = segments.map((seg, idx) => {
    // Math segments matched by capturing group (odd indexes) are returned untouched
    if (idx % 2 === 1) {
      return seg;
    }
    
    let result = seg;
    const placeholders = [];
    
    sorted.forEach((hl) => {
      if (!hl.text || !hl.text.trim()) return;
      const escaped = hl.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      let regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      if (!regex.test(result)) regex = new RegExp(escaped, 'gi');
      regex.lastIndex = 0;
      result = result.replace(regex, (match) => {
        const placeholder = `___HL_PLACEHOLDER_${placeholders.length}___`;
        const cleanColor = (hl.color || 'blue').toLowerCase().replace(/^text-/, '').trim();
        const html = `<span class="text-${cleanColor} font-bold">${match}</span>`;
        placeholders.push({ placeholder, html });
        return placeholder;
      });
    });
    
    placeholders.forEach(({ placeholder, html }) => {
      result = result.replace(placeholder, html);
    });
    
    return result;
  });
  
  return processedSegments.join('');
}

/**
 * Converts markdown tables to beautifully styled HTML tables
 */
export function convertMarkdownTablesToHtml(text) {
  if (!text) return '';
  const tableRegex = /((?:\s*\|[^\n]*\|[^\n]*(?:\n|$))+)/g;
  return text.replace(tableRegex, (match) => {
    const lines = match.trim().split('\n').map(l => l.trim());
    if (lines.length < 2) return match;
    const isSeparator = /^\|[\s\:\-\|]+\|$/.test(lines[1]);
    if (!isSeparator) return match;
    
    let html = '<div class="nk-mentor-table-wrapper"><table class="nk-mentor-table">';
    const headers = lines[0].split('|').map(s => s.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    html += '<thead><tr>';
    headers.forEach(h => { 
      const formattedHeader = h ? h.charAt(0).toUpperCase() + h.slice(1).toLowerCase() : '';
      html += `<th>${formattedHeader}</th>`; 
    });
    html += '</tr></thead><tbody>';
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      html += '<tr>';
      cells.forEach(c => { html += `<td>${c}</td>`; });
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
  });
}

/**
 * Formats markdown → rich colorful HTML for AI responses.
 * - H2 headings: rose/red color (visually striking)
 * - H3 headings: amber/orange color
 * - Bold: amber keyword highlight
 * - Lists & paragraphs: text-sm
 */
export function formatMentorResponse(text) {
  if (!text) return '';
  
  // Strip any residual code fences the AI may have added
  let cleanText = stripCodeFences(text);
  
  // Unescape double-escaped newlines
  cleanText = cleanText.replace(/\\n/g, '\n');
  
  // Convert markdown tables first
  cleanText = convertMarkdownTablesToHtml(cleanText);
  
  // Bold markdown → amber-colored keyword spans
  cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '<b class="text-amber-500 dark:text-amber-400 font-extrabold">$1</b>');
  cleanText = cleanText.replace(/\*([^\*]+?)\*/g, '<i class="text-amber-500 dark:text-amber-400">$1</i>');
  
  const lines = cleanText.split('\n');
  let inList = false;
  let listType = null;
  let formattedLines = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Pass through already-HTMLized table content
    const isTableHtml = [
      '<div class="nk-mentor-table-wrapper">', '<table', '<thead', '<tbody',
      '<tr>', '<th>', '<td>', '</tr>', '</th>', '</td>', '</table>', '</div>'
    ].some(tag => trimmed.startsWith(tag));
    
    if (isTableHtml) {
      if (inList) { inList = false; formattedLines.push(listType === 'ul' ? '</ul>' : '</ol>'); }
      formattedLines.push(line);
      return;
    }
    
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList || listType !== 'ul') {
        if (inList) formattedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = true; listType = 'ul';
        formattedLines.push('<ul class="list-disc pl-5 mb-3 space-y-1.5">');
      }
      formattedLines.push(`<li class="text-sm font-medium text-theme-text leading-relaxed">${trimmed.substring(2)}</li>`);
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        if (inList) formattedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = true; listType = 'ol';
        formattedLines.push('<ol class="list-decimal pl-5 mb-3 space-y-1.5">');
      }
      const spaceIdx = trimmed.indexOf(' ');
      formattedLines.push(`<li class="text-sm font-medium text-theme-text leading-relaxed">${trimmed.substring(spaceIdx + 1)}</li>`);
    } else {
      if (inList) { inList = false; formattedLines.push(listType === 'ul' ? '</ul>' : '</ol>'); }
      
      if (trimmed.startsWith('#### ')) {
        // H4 — amber
        formattedLines.push(`<h6 class="font-black text-base text-amber-600 dark:text-amber-400 mt-4 mb-2 tracking-tight">${trimmed.substring(5)}</h6>`);
      } else if (trimmed.startsWith('### ')) {
        // H3 — orange/amber (section label)
        formattedLines.push(`<h5 class="font-black text-lg text-orange-500 dark:text-orange-400 mt-5 mb-2.5 tracking-tight flex items-center gap-1.5">${trimmed.substring(4)}</h5>`);
      } else if (trimmed.startsWith('## ')) {
        // H2 — rose/red (major section heading)
        formattedLines.push(`<h4 class="font-black text-xl text-rose-600 dark:text-rose-400 mt-6 mb-3 tracking-tight border-b-2 border-rose-500/25 pb-1">${trimmed.substring(3)}</h4>`);
      } else if (trimmed.startsWith('# ')) {
        // H1 — deep red (title)
        formattedLines.push(`<h3 class="font-black text-2xl text-rose-700 dark:text-rose-300 mt-4 mb-3 tracking-tight">${trimmed.substring(2)}</h3>`);
      } else if (trimmed.startsWith('---') || trimmed.startsWith('***')) {
        formattedLines.push('<hr class="border-theme-border my-4" />');
      } else if (trimmed) {
        formattedLines.push(`<p class="text-sm font-medium text-theme-text mb-3 leading-relaxed">${trimmed}</p>`);
      } else {
        formattedLines.push('<div class="h-2"></div>');
      }
    }
  });
  
  if (inList) formattedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
  
  let html = formattedLines.join('\n');
  return renderMathInHtmlString(html);
}

// ══════════════════════════════════════════════════════════════
//  MASTER PROMPTER — 4 Mode System Prompts
// ══════════════════════════════════════════════════════════════

/**
 * MCQ CREATOR mode
 * Returns JSON: { mcqs: [{ question, options, correctId, explanation, colorCode }] }
 * No user stats sent.
 */
export function buildMcqCreatorPrompt(userPrompt) {
  const cleanPrompt = userPrompt?.trim() || 'any interesting topic from competitive exam syllabus';
  
  // Parse desired question count (default to 5)
  let count = 5;
  const numberMatch = cleanPrompt.match(/(\d+)\s*(?:mcq|question|q)/i);
  if (numberMatch) {
    count = parseInt(numberMatch[1], 10);
  }

  const systemPrompt = `You are 'Kash, the MCQ Creator' — an elite question designer for competitive exam aspirants.
Your task: Generate exactly ${count} high-quality, challenging multiple-choice questions based on the user's prompt.

PROMPT PROMINENCE & CUSTOMIZATION:
- Carefully analyze the user's prompt: "${cleanPrompt}". Give it absolute prominence.
- If the user specifies subtopics, focus areas, difficulty biases, or particular question formats (such as Assertion-Reasoning, Statement-based, Match the Column, or Factual/Conceptual), you MUST adapt the questions to match their requests precisely.
- Maintain a proportional difficulty division (roughly 40% Hard, 40% Medium, and 20% Easy) across the ${count} questions unless the user explicitly requests otherwise.

FORMAT — Return ONLY a JSON object (no markdown code fences):
{
  "title": "A short, punchy title like 'Polity: Fundamental Rights'",
  "mcqs": [
    {
      "question": "Full question text here. (Use LaTeX like $E = mc^2$ or $25^\\circ\\text{C}$ for formatting if applicable.)",
      "options": [
        { "id": "a", "text": "Option A text" },
        { "id": "b", "text": "Option B text" },
        { "id": "c", "text": "Option C text" },
        { "id": "d", "text": "Option D text" }
      ],
      "correctId": "b",
      "explanation": "A SHORT (2-3 sentence max) explanation. Use **bold** for key terms. Keep it punchy and insightful, not textbook-long.",
      "difficulty": "Medium"
    }
  ]
}

Rules:
- Questions must be challenging, exam-relevant, and require analysis, not just rote recall.
- Explanation must be SHORT (2-3 sentences) and highlight the KEY reason why the correct answer is right.
- Return ONLY valid JSON — no extra text, no markdown code fences.`;

  const userMsg = `Generate exactly ${count} MCQs based on: ${cleanPrompt}`;
  return { systemPrompt, userMsg };
}

/**
 * STUDY PLAN mode
 * Returns markdown plan (not JSON wrapper).
 * Sends ghost profile (light user data).
 */
export function buildStudyPlanPrompt(userPrompt, ghostProfile, stats) {
  const hasCustomPrompt = userPrompt?.trim().length > 0;
  const statsContext = ghostProfile || `Accuracy: ${stats?.accuracyRate || 0}%, Tests: ${stats?.totalTests || 0}, Questions solved: ${stats?.totalQuestions || 0}`;

  const systemPrompt = `You are 'Kash, the Strategic Planner' — an expert study coach for competitive exam aspirants.
Your student's performance snapshot: ${statsContext}

${hasCustomPrompt
    ? `The student has given you a CUSTOM planning request. Fulfill it exactly as asked. Adapt the number of days, subjects, and structure to match their request precisely.`
    : `Generate a default WEEKLY (7-day) study schedule for this aspirant.`
  }

FORMAT your response in clean markdown:
1. Start with a ## heading for the plan title
2. Create a structured markdown TABLE (| Day | Morning | Afternoon | Evening |) with 3 time slots per day
3. After the table, add a ### "Key Strategy" section with 3-5 bullet points on HOW to follow the plan
4. Be specific — name actual subjects, topics, and hour targets
5. Be realistic — account for the student's current performance level

Language rules:
- Say "your competitive exam" NOT "UPSC" or "Prelims" or any specific exam name
- Say "exam aspirant" NOT "civil services aspirant"
- Be motivating but brutally honest about what needs improvement

Return ONLY the markdown content. No JSON. No code fences.`;

  const userMsg = hasCustomPrompt
    ? userPrompt.trim()
    : "Generate my weekly study plan";

  return { systemPrompt, userMsg };
}

/**
 * REPORT CARD mode
 * Full diagnostic with user stats. Returns clean markdown (extracted from JSON).
 */
export function buildReportCardPrompt(stats) {
  const systemPrompt = `You are 'Kash, the Performance Analyst' — a ruthlessly honest yet motivating exam coach.
Analyze the student's performance metrics and generate a comprehensive diagnostic report.

FORMAT — Return a JSON object with exactly TWO keys (no markdown fences):
{
  "reportMarkdown": "Full diagnostic report in markdown format...",
  "ghostProfile": "2-3 sentence ultra-compressed summary for context use."
}

The reportMarkdown must include:
## Overall Performance Score (give a score like X/10 based on accuracy)
## Strength Analysis (what they're doing right)
## Critical Weaknesses (brutal truth — no sugar coating)
## Risk Assessment (probability of clearing, e.g. '72% probability of clearing cutoff if accuracy improves by 15%')
## 30-Day Action Plan (3-5 specific daily actions)
## Motivational Close

Language rules:
- Say "your competitive exam" NOT "UPSC" or "Prelims"
- Say "exam cutoff" NOT "Prelims cutoff"
- Use **bold** for key stats and terms
- Use markdown tables where useful
- Be specific and data-driven, not generic

Return ONLY valid JSON. No code fences. No extra text.`;

  const userMsg = `Student Performance Data:
- Mock tests completed: ${stats.totalTests}
- Total questions attempted: ${stats.totalQuestions}
- Correct answers: ${stats.totalCorrect}
- Incorrect answers: ${stats.totalIncorrect}
- Overall accuracy: ${stats.accuracyRate}%
- Recent test history: ${JSON.stringify((stats.history || []).slice(0, 5))}

Generate the full diagnostic report.`;

  return { systemPrompt, userMsg };
}

/**
 * LEARN STUFF mode
 * Theory-based concept card. No user stats.
 * Returns markdown content.
 */
export function buildLearnStuffPrompt(userPrompt) {
  const topic = userPrompt?.trim() || '';
  const hasCustomTopic = topic.length > 0;

  const systemPrompt = `You are 'Kash, the Knowledge Architect' — a master teacher who explains concepts beautifully and memorably.
${hasCustomTopic
    ? `Explain the requested topic in a structured, engaging theory card.`
    : `Choose ONE fascinating, exam-relevant topic from any of these areas: History, Geography, Polity, Economy, Science & Technology, Environment, or Current Affairs. Make it something genuinely interesting and likely to appear in exams.`
  }

FORMAT your response as a beautiful, structured theory card in markdown:

## [Topic Name Here]

### 🎯 Core Concept
[2-3 sentence clear definition or explanation. Be precise, not verbose.]

### 📌 Key Facts
[4-5 bullet points of the most important, exam-relevant facts. Each bullet = one crisp fact.]

### 🔗 Why It Matters
[1-2 sentences on why this topic is exam-important and what type of questions appear on it.]

### 🧠 Memory Trick
[One clever mnemonic, acronym, visual association, or story-based trick to remember this topic permanently. This is MANDATORY.]

Rules:
- Start DIRECTLY with the topic title heading (## [Topic Name]). Do NOT include any introductory chit-chat, conversational text, conversational fluff, or filler text (e.g. do NOT say "Today we will study...", "Here is...", etc.). The response must be a clean, production-ready, polished study card.
- Keep it SHORT and HIGH-DENSITY. No padding, no filler.
- Use **bold** for key terms that must be remembered.
- This is a CONCEPT CARD, not an essay. Quality > quantity.
- Do NOT include any student statistics, diagnostics, performance predictions, or weak area analysis. Focus strictly on explaining the concept academically.
- End ALWAYS with the 🧠 Memory Trick section.

Return ONLY markdown. No JSON. No code fences.`;

  const userMsg = hasCustomTopic ? topic : "Teach me something interesting";
  return { systemPrompt, userMsg };
}

/**
 * Converts markdown bold (**) and italics (*) to HTML tags (strong, em)
 */
export function convertMarkdownToHtml(text) {
  if (!text) return '';
  let result = text;
  // bold: **text**
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // italic: *text*
  result = result.replace(/\*([^\*]+?)\*/g, '<em>$1</em>');
  return result;
}
