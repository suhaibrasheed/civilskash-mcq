import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { Bookmark, CheckCircle2, XCircle, Lightbulb, Lock, Zap, Wand2, Sparkles, Loader2, ArrowRight, Split } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleBookmarkDB, isBookmarkedDB, markQuestionForResurrection, saveOutput } from '../lib/db';
import { useEconomy } from '../context/EconomyContext';
import { useSound } from '../context/SoundContext';
import { queryGenerativeAI, renderMathInHtmlString, applyHighlightsToText, formatExplanationLayout } from '../lib/ai';
import { useToast } from '../context/ToastContext';

/**
 * 3D aesthetic difficulty dot. Unmarked MCQs still get a neutral dot so cards stay visually balanced.
 */
function DifficultyDot({ difficulty }) {
  const d = String(difficulty || 'unmarked').toLowerCase();

  const config = {
    easy:     { dot: 'bg-emerald-400', glow: 'shadow-emerald-400/60' },
    medium:   { dot: 'bg-blue-400',    glow: 'shadow-blue-400/60'    },
    hard:     { dot: 'bg-rose-400',    glow: 'shadow-rose-400/60'    },
    unmarked: { dot: 'bg-slate-400',   glow: 'shadow-slate-400/50'   },
  };

  const style = config[d] || config.unmarked;

  return (
    <div className="relative flex-shrink-0 w-4 h-4 group-hover:scale-110 transition-transform duration-300">
      {/* 3D glowing sphere */}
      <div className={`absolute inset-0 rounded-full ${style.dot} shadow-[0_0_10px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(0,0,0,0.25)] shadow-md ${style.glow}`} />
      {/* Specular highlight — top-left white glint for 3D look */}
      <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-white/90 blur-[0.1px]" />
      {/* Subtle outer ring */}
      <div className="absolute -inset-0.5 rounded-full border border-theme-border opacity-20" />
    </div>
  );
}

const hashString = (value = '') => {
  let hash = 0;
  const text = String(value);
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getLockedCardVisuals = (id) => {
  const seed = hashString(id);
  const difficultyRoll = seed % 100;
  const difficulty = difficultyRoll < 60 ? 'Hard' : difficultyRoll < 90 ? 'Medium' : 'Easy';
  const tagCount = 2 + (seed % 2);
  const tagWidths = Array.from({ length: tagCount }, (_, idx) => {
    const min = idx === 0 ? 68 : 52;
    return min + (Math.floor(seed / (2 ** (idx * 5))) % 64);
  });

  return { difficulty, tagWidths };
};

const hasImageOrVideo = (explanation) => {
  if (!explanation) return false;
  if (/<img|<iframe|<video/i.test(explanation)) return true;
  if (/(?:^|\s|\b)(img[lrc]?|vid)\s+https?:\/\//i.test(explanation)) return true;
  if (/\bhttps?:\/\/[^\s"']+\.(?:png|jpg|jpeg|gif|svg|webp)\b/i.test(explanation)) return true;
  if (/youtube\.com|youtu\.be|vimeo\.com|data-video-url/i.test(explanation)) return true;
  return false;
};

export default function McqCard({
  questionData,
  showExplanationToggle = false,
  mode = 'practice',
  onSelect = null,
  externalSelection = null,
  onTagClick = null,          // (tag: string) => void — for clickable tags in practice mode
  searchTerm = "",
  onUse5050 = null,           // Callback when 50/50 lifeline is activated
}) {
  const { economy, transactKC, openProUpsell } = useEconomy();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const alert = (msg) => {
    showToast(msg, msg.toLowerCase().includes('success') ? 'success' : 'error');
  };
  const { playCorrect, playWrong, playShatter } = useSound();
  const [localSelectedOption, setLocalSelectedOption] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [zoomedImg, setZoomedImg] = useState(null);

  const highlightSearchTerm = (html, term) => {
    if (!term || !term.trim()) return html;
    const cleanTerm = term.trim();
    const escaped = cleanTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escaped})(?![^<>]*>)`, 'gi');
    return html.replace(regex, '<span class="text-theme-primary font-black underline decoration-theme-primary/30 decoration-2">$1</span>');
  };

  // AI Tutor States & Handlers
  const [aiExplanation, setAiExplanation] = useState(() => {
    try {
      return localStorage.getItem(`mcq_ai_explanation_cache_${questionData.id}`) || null;
    } catch (e) {
      return null;
    }
  });
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleAiTutorClick = async (e) => {
    e.stopPropagation();
    if (economy?.user_tier !== 'Pro') {
      openProUpsell('AI Tutor');
      return;
    }

    const provider = localStorage.getItem('civilsKash_aiProvider') || 'gemini';
    const activeKey = 
      provider === 'gemini' ? localStorage.getItem('civilsKash_geminiKey') :
      provider === 'openai' ? localStorage.getItem('civilsKash_openaiKey') :
      provider === 'huggingface' ? localStorage.getItem('civilsKash_huggingfaceKey') : 
      localStorage.getItem('civilsKash_openrouterKey');

    if (!activeKey) {
      setAiError(`API key for ${provider.toUpperCase()} not found. Please add your key in the Profile Settings page to use the AI Tutor.`);
      return;
    }

    setLoadingAi(true);
    setAiError('');
    setAiExplanation(null);

    try {
      const systemPrompt = `You are 'Kash, the Personal AI Tutor,' an elite Civil Services exam coach.
      Your task is to analyze the MCQ provided and generate a very short, crisp, options-oriented explanation masterclass.
      
      Generate a response in JSON format containing four keys:
      1. "takeaway": A very short 1-2 sentence core concept explanation.
      2. "optionsBreakdown": An object mapping each option (A, B, C, D) to a very short 1-sentence breakdown explaining why it is correct or incorrect.
      3. "mnemonic": A short, highly memorizable memory trick or mnemonic (in Hinglish or English, whichever is most memorizable) to lock in this concept.
      4. "highlights": An array of objects for keyword coloring in the takeaway, optionsBreakdown texts, or mnemonic. Each highlight object must have:
         - "text": The exact substring (case-sensitive) to highlight.
         - "color": One of 'red', 'green', 'blue', 'orange', 'magenta'.
         - Keep highlights focused on crucial names, dates, acts, numbers, or rules. Limit to 4-5 total highlights.
      
      Return ONLY the JSON payload. Do NOT wrap in markdown code blocks.`;

      const userPrompt = `MCQ Question: ${questionData.question}
      Options:
      ${questionData.options.map(o => `${o.label}) ${o.text}`).join('\n')}
      Correct Option: ${questionData.correctId}
      Standard Explanation: ${questionData.explanation}`;

      const response = await queryGenerativeAI(systemPrompt, userPrompt);
      if (response) {
        const sanitized = response.replace(/\t/g, '\\\\t');
        const cleanJson = sanitized.trim().replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
        let data;
        try {
          data = JSON.parse(cleanJson);
        } catch (e) {
          try {
            // Repair trailing commas, escaped single quotes, and control chars
            const repaired = cleanJson
              .replace(/,\s*([\]}])/g, '$1') 
              .replace(/\\'/g, "'")
              .replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
            data = JSON.parse(repaired);
          } catch (err) {
            console.error("JSON Repair failed:", cleanJson);
            throw new Error("AI Tutor returned slightly malformed data. Please click 'Ask AI Tutor' again to retry!");
          }
        }
        
        const highlights = data.highlights || [];
        
        // Highlight content
        const highlightedTakeaway = applyHighlightsToText(data.takeaway || '', highlights);
        const optKeys = Object.keys(data.optionsBreakdown || {});
        let optionsListHtml = '';
        optKeys.forEach(k => {
          const rawText = data.optionsBreakdown[k] || '';
          const highlightedText = applyHighlightsToText(rawText, highlights);
          optionsListHtml += `
            <li class="flex items-start gap-2 text-xs text-theme-text font-medium leading-relaxed">
              <span class="font-bold text-amber-500 min-w-[20px]">${k}:</span>
              <span class="flex-1">${highlightedText}</span>
            </li>`;
        });
        
        const highlightedMnemonic = applyHighlightsToText(data.mnemonic || '', highlights);

        // Build premium formatted HTML block
        const formattedHtml = `
          <div class="space-y-4">
            <div>
              <div class="text-[11px] font-black text-amber-600 tracking-wider mb-1.5 flex items-center gap-1">
                🎯 Core Takeaway
              </div>
              <p class="text-xs text-theme-text font-medium leading-relaxed">${highlightedTakeaway}</p>
            </div>
            
            <div>
              <div class="text-[11px] font-black text-amber-600 tracking-wider mb-2 flex items-center gap-1">
                ⚖️ Distractor Review
              </div>
              <ul class="space-y-2 list-none pl-0">
                ${optionsListHtml}
              </ul>
            </div>
            
            ${data.mnemonic ? `
            <div class="mnemonic-box p-3 rounded-xl border">
              <div class="mnemonic-title text-[11px] font-black tracking-wider mb-1 flex items-center gap-1">
                🧠 Memory Trick / Mnemonic
              </div>
              <p class="mnemonic-text text-xs italic font-semibold leading-relaxed">${highlightedMnemonic}</p>
            </div>` : ''}
          </div>
        `;

        // Render math equations in final html
        const finalHtml = renderMathInHtmlString(formattedHtml);
        setAiExplanation(finalHtml);
        try {
          localStorage.setItem(`mcq_ai_explanation_cache_${questionData.id}`, finalHtml);
        } catch (e) {
          console.error("Failed to cache AI explanation", e);
        }
      } else {
        throw new Error("AI Tutor failed to respond. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setAiError(err.message);
    } finally {
      setLoadingAi(false);
    }
  };

  React.useEffect(() => {
    // Reset AI state & check cache when question changes
    setLoadingAi(false);
    setAiError('');
    try {
      setAiExplanation(localStorage.getItem(`mcq_ai_explanation_cache_${questionData.id}`) || null);
    } catch (e) {
      setAiExplanation(null);
    }
    const checkBookmark = async () => {
      const saved = await isBookmarkedDB(questionData.id);
      setIsBookmarked(saved);
    };
    checkBookmark();

    // Reset local selection when question changes or when external selection is cleared
    if (externalSelection === null) {
      setLocalSelectedOption(null);
    }
  }, [questionData.id, externalSelection]);

  const toggleBookmark = async () => {
    const newState = await toggleBookmarkDB(questionData);
    setIsBookmarked(newState);
    if (newState) {
      if (questionData.isAiMockQuestion || (typeof questionData.id === 'string' && questionData.id.startsWith('ai_mock_'))) {
        showToast("Bookmarked! Saved to 'Question Bank' under Personal AI.", "success");
      } else {
        showToast("Saved to bookmarks!", "success");
      }
    }
    // Dispatch custom event to notify BookmarkDashboard if it's listening
    window.dispatchEvent(new Event('bookmarksUpdated'));
  };
  const [showExplanation, setShowExplanation] = useState(mode === 'result');

  const selectedOption = externalSelection !== null ? externalSelection : localSelectedOption;

  const handleSelect = async (optionId) => {
    if (mode === 'result') return;
    if (mode === 'practice' && selectedOption) return; // Lock once answered

    if (questionData.isGuestQuestion && onSelect) {
      onSelect(optionId);
      return;
    }

    if (!externalSelection) {
      setLocalSelectedOption(optionId);
    }

    if (onSelect) {
      onSelect(optionId);
    }

    if (mode === 'practice' && showExplanationToggle) {
      setShowExplanation(true);
      if (optionId !== questionData.correctId) {
        playWrong();
        await markQuestionForResurrection(questionData).catch(() => {});
      } else {
        playCorrect();
      }
    } else {
      playCorrect(); // Minimal tick for exam selection
    }
  };

  const handleTagClick = (e, tag) => {
    if (mode !== 'practice' || !onTagClick) return;
    e.stopPropagation();
    onTagClick(tag);
  };

  const handle5050 = async () => {
    if (!economy || economy.kash_coins_balance < 3 || eliminatedOptions.length > 0 || selectedOption) return;
    const success = await transactKC(-3);
    if (success) {
      const incorrectOptions = questionData.options.filter(o => o.id !== questionData.correctId);
      const shuffled = incorrectOptions.sort(() => 0.5 - Math.random());
      setEliminatedOptions([shuffled[0].id, shuffled[1].id]);
      if (onUse5050) {
        onUse5050();
      }
    } else {
      showToast("Not enough KashCoins! Keep your streak up to earn more.", "warning");
    }
  };

  if (questionData.isLockedDummy) {
    const lockedVisuals = getLockedCardVisuals(questionData.id);
    const isGuestDummy = !!questionData.isGuestDummy;

    return (
      <div className="mcq-glass-card max-w-3xl mx-auto w-full min-h-[410px] p-6 rounded-[1.35rem] relative overflow-hidden group flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(245,158,11,0.16),transparent_34%),radial-gradient(circle_at_88%_20%,rgba(59,130,246,0.11),transparent_30%)] pointer-events-none" />
        <div className="absolute inset-x-8 top-20 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <div className="relative flex justify-between items-center">
          <div className="flex flex-wrap gap-2 items-center min-w-0">
            <DifficultyDot difficulty={lockedVisuals.difficulty} />
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-white border shadow-[0_0_12px_rgba(245,158,11,0.12)] ${
              isGuestDummy ? 'bg-theme-primary/80 border-theme-primary/30' : 'bg-amber-500/12 text-amber-500 border border-amber-500/25'
            }`}>
              <Zap size={11} className="fill-current" />
              <span className={`text-[10px] font-black uppercase tracking-widest ${isGuestDummy ? 'text-white' : 'text-amber-500'}`}>
                {isGuestDummy ? 'Sign Up' : 'Pro MCQ'}
              </span>
            </div>
            {lockedVisuals.tagWidths.map((width, idx) => (
              <span
                key={idx}
                aria-label="Blurred tag"
                className="h-7 rounded-full bg-theme-primary/10 border border-theme-primary/15 blur-[2px] opacity-80"
                style={{ width }}
              />
            ))}
          </div>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
            isGuestDummy ? 'bg-theme-primary/10 border-theme-primary/20 text-theme-primary' : 'bg-amber-500/12 border border-amber-500/25 text-amber-500'
          }`}>
            <Lock size={18} />
          </div>
        </div>

        <div className="relative flex-1 flex items-center justify-center py-12">
          <div className="absolute left-2 right-2 top-10 space-y-4 opacity-25 pointer-events-none">
            <div className="h-3 w-10/12 rounded-full bg-theme-text/20 blur-[1px]" />
            <div className="h-3 w-7/12 rounded-full bg-theme-text/15 blur-[1px]" />
          </div>
          <div className="relative max-w-md mx-auto text-center flex flex-col items-center">
            <div className={`mb-5 w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${
              isGuestDummy ? 'bg-theme-primary/10 border-theme-primary/20 text-theme-primary' : 'bg-amber-500/12 border border-amber-500/25 text-amber-500'
            }`}>
              <Lock size={30} />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-theme-text tracking-tight mb-4">
              {isGuestDummy ? 'Unlock Expert MCQs' : 'Premium MCQ Locked'}
            </h2>
            <p className="text-sm md:text-base leading-8 text-theme-muted font-semibold">
              {isGuestDummy 
                ? 'Create a free MCQKash account to unlock full topic-wise practice questions, explanations, and progress metrics.'
                : 'This Expert MCQ is prepared for premium aspirants to sharpen concepts, speed, tricks and elimination ability. Upgrade to Pro to unlock MCQ\'s with Elite Explanation & Tricks.'}
            </p>
            {isGuestDummy ? (
              <Link
                to="/signin"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-theme-primary to-theme-accent text-white font-black text-xs uppercase tracking-widest shadow-md hover:opacity-95 transition-all"
              >
                Sign Up Now
                <ArrowRight size={14} />
              </Link>
            ) : (
              <Link
                to="/upgrade"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs uppercase tracking-widest shadow-md hover:opacity-95 transition-all"
              >
                Upgrade to Pro
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-sm ${
            isGuestDummy ? 'bg-theme-primary/5 border-theme-primary/10 text-theme-primary' : 'bg-amber-500/8 border border-amber-500/20'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full shadow-md ${isGuestDummy ? 'bg-theme-primary' : 'bg-amber-400'}`} />
            <p className={`text-[11px] font-black uppercase tracking-[0.24em] ${isGuestDummy ? 'text-theme-primary/80' : 'text-amber-500/85'}`}>
              {isGuestDummy ? 'Join the leaderboard' : 'Elite prep content'}
            </p>
            <span className={`h-1.5 w-1.5 rounded-full shadow-md ${isGuestDummy ? 'bg-theme-primary' : 'bg-amber-400'}`} />
          </div>
        </div>
      </div>
    );
  }

  const allTags = questionData.tags || [];
  const hasProTag = allTags.some(t => t.toLowerCase() === '#pro');
  const pyqVal = questionData.pyq || allTags.find(t => typeof t === 'string' && t.startsWith('PYQ: '))?.replace('PYQ: ', '') || null;
  const regularTags = allTags.filter(t => t.toLowerCase() !== '#pro' && !t.startsWith('PYQ: '));

  // Determine pipeline border colors
  const status = questionData.status || questionData.revisionRecord?.status;
  const srsInterval = questionData.srs_interval || questionData.revisionRecord?.srs_interval;
  let borderOverride = {};

  if (status === 'SRS') {
    if (srsInterval === 1 || srsInterval === 3) {
      borderOverride = { borderColor: 'rgba(249, 115, 22, 0.45)', boxShadow: '0 0 15px rgba(249, 115, 22, 0.08)' };
    } else if (srsInterval === 7 || srsInterval === 15 || srsInterval === 30) {
      borderOverride = { borderColor: 'rgba(59, 130, 246, 0.45)', boxShadow: '0 0 15px rgba(59, 130, 246, 0.08)' };
    } else if (srsInterval === 60) {
      borderOverride = { borderColor: 'rgba(16, 185, 129, 0.45)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.08)' };
    }
  } else if (status === 'Mastered') {
    borderOverride = { borderColor: 'rgba(16, 185, 129, 0.45)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.08)' };
  }

  return (
    <div 
      className="mcq-glass-card max-w-3xl mx-auto w-full p-5 md:p-7 rounded-[1.35rem] relative overflow-hidden"
      style={borderOverride}
      onClickCapture={(e) => {
        if (e.target.tagName === 'IMG' && e.target.classList.contains('nk-mcq-image')) {
          e.stopPropagation();
          e.preventDefault();
          setZoomedImg(e.target.src);
        }
      }}
    >

      {/* Header: Difficulty Dot + Tags + Flag */}
      <div className="relative flex justify-between items-start mb-4 gap-2">
        <div className="flex items-start gap-2 flex-grow min-w-0">
          {/* Difficulty Dot — anchored at the start, never wraps alone */}
          <div className="mt-[7px] flex-shrink-0">
            <DifficultyDot difficulty={questionData.difficulty} />
          </div>

          <div className="flex flex-wrap gap-1.5 items-center min-w-0">
            {/* PYQ Badge — gold accent premium badge */}
            {pyqVal && (
              <button
                onClick={(e) => handleTagClick(e, `PYQ: ${pyqVal}`)}
                disabled={mode !== 'practice' || !onTagClick}
                className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full border border-amber-500/25 dark:border-amber-400/20 bg-amber-500/8 dark:bg-amber-400/5 text-amber-600 dark:text-amber-400 shadow-[0_1px_6px_rgba(245,158,11,0.05)] transition-all duration-200 whitespace-nowrap flex-shrink-0 backdrop-blur-[4px]
                  ${mode === 'practice' && onTagClick
                    ? 'cursor-pointer hover:bg-amber-500/15 dark:hover:bg-amber-400/10 hover:border-amber-500/40 hover:scale-105 active:scale-95'
                    : 'cursor-default'
                  }`}
              >
                <Sparkles size={10} className="mr-1.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                <span>{pyqVal}</span>
              </button>
            )}

            {/* Pro Tag Badge */}
            {hasProTag && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-semibold border border-amber-500/20 flex-shrink-0 whitespace-nowrap">
                <Zap size={10} className="fill-current flex-shrink-0" />
                <span>Pro</span>
              </div>
            )}

            {/* Regular tags — matching design system gold glassmorphic pill */}
            {regularTags.map(tag => (
              <button
                key={tag}
                onClick={(e) => handleTagClick(e, tag)}
                disabled={mode !== 'practice' || !onTagClick}
                className={`flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-500/25 dark:border-amber-400/20 bg-amber-500/8 dark:bg-amber-400/5 text-amber-600 dark:text-amber-400 shadow-[0_1px_6px_rgba(245,158,11,0.05)] transition-all duration-200 whitespace-nowrap flex-shrink-0 backdrop-blur-[4px]
                  ${mode === 'practice' && onTagClick
                    ? 'cursor-pointer hover:bg-amber-500/15 dark:hover:bg-amber-400/10 hover:border-amber-500/40 hover:scale-105 active:scale-95'
                    : 'cursor-default'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Action Toolbar — Borderless, clean, and spacious */}
        <div className="flex items-center gap-[3px] flex-shrink-0 ml-2">
          {mode !== 'result' && eliminatedOptions.length === 0 && !selectedOption && economy?.kash_coins_balance >= 3 && (
            <button
              onClick={handle5050}
              className="flex items-center justify-center w-9 h-9 rounded-full text-amber-500 hover:bg-amber-500/10 transition-all active:scale-90 flex-shrink-0"
              title="50/50 Hint (Cost: 3 KC)"
            >
              <Split size={20} />
            </button>
          )}
          {mode !== 'exam' && showExplanationToggle && selectedOption && (
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 h-9 rounded-xl transition-all duration-200 flex-shrink-0 whitespace-nowrap active:scale-90
                ${showExplanation 
                  ? 'text-amber-500 bg-amber-500/10' 
                  : 'text-theme-text hover:bg-theme-surface-hover/50 dark:hover:bg-theme-surface-hover/20 hover:text-theme-text'}`}
            >
              <Lightbulb size={18} className={showExplanation ? 'text-amber-500' : ''} />
              <span>{showExplanation ? 'Hide' : 'Solution'}</span>
            </button>
          )}
          <button
            onClick={toggleBookmark}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 active:scale-90 flex-shrink-0 ${isBookmarked ? 'text-amber-500 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.1)]' : 'text-slate-400 dark:text-slate-500 hover:text-amber-500/85 hover:bg-amber-500/5'}`}
            title="Bookmark this question"
          >
            <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Question */}
      <h2 className="relative text-theme-text text-base font-bold mb-4 leading-relaxed tracking-tight">
        <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(renderMathInHtmlString(questionData.question), searchTerm) }} />
      </h2>

      {/* Options */}
      <div className="relative space-y-2.5">
        <AnimatePresence>
          {questionData.options.map((option) => {
            const isSelected = selectedOption === option.id;
            const isCorrect = option.id === questionData.correctId;
            const showFeedback = (mode === 'practice' && selectedOption !== null) || mode === 'result';
            const isEliminated = eliminatedOptions.includes(option.id);

            // ── Option row base ───────────────────────────────────────
            let rowClass = 'w-full relative flex items-center gap-3.5 p-3.5 rounded-[0.95rem] text-left text-sm transition-all duration-200';
            // ── Letter bubble ─────────────────────────────────────────
            let bubbleClass = 'mcq-letter w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-200';

            if (isEliminated && !showFeedback) {
              // Eliminated by 50/50
              rowClass += ' mcq-option-muted text-theme-muted opacity-25 pointer-events-none blur-[0.4px]';
              bubbleClass += ' text-theme-muted';
            } else if (!showFeedback && !isSelected) {
              // Idle — clean, subtle, inviting
              rowClass += ' mcq-option-row cursor-pointer';
              bubbleClass += ' text-theme-muted group-hover:text-theme-primary';
            } else if (!showFeedback && isSelected) {
              // Selected, not yet revealed
              rowClass += ' mcq-option-selected cursor-pointer';
              bubbleClass += ' bg-theme-primary text-white';
            } else if (showFeedback && isCorrect) {
              // Correct
              rowClass += ' mcq-option-correct text-emerald-800 dark:text-emerald-300 pointer-events-none';
              bubbleClass += ' bg-emerald-500 text-white';
            } else if (showFeedback && isSelected && !isCorrect) {
              // Wrong selection
              rowClass += ' mcq-option-wrong text-rose-800 dark:text-rose-300 pointer-events-none';
              bubbleClass += ' bg-rose-500 text-white';
            } else {
              // Unchosen, after reveal
              rowClass += ' mcq-option-muted text-theme-muted opacity-40 pointer-events-none';
              bubbleClass += ' text-theme-muted';
            }

            return (
              <motion.button
                layout
                animate={isEliminated && !showFeedback 
                  ? { 
                      opacity: 0.25, 
                      scale: 0.97,
                      x: -6,
                      filter: "blur(0.4px)",
                      transition: { type: "spring", stiffness: 120, damping: 14 }
                    } 
                  : { opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }
                }
                whileHover={!showFeedback && !isEliminated ? { scale: 1.01, x: 4 } : {}}
                whileTap={!showFeedback && !isEliminated ? { scale: 0.985 } : {}}
                key={option.id}
                disabled={showFeedback || isEliminated}
                onClick={() => handleSelect(option.id)}
                className={`group ${rowClass}`}
              >
                {/* Letter Bubble */}
                <span className={bubbleClass}>{option.label}</span>

                {/* Option Text */}
                <span className="flex-1 font-medium text-xs md:text-sm leading-snug">
                  <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(renderMathInHtmlString(option.text), searchTerm) }} />
                </span>

                {/* Premium Animated Strike-through Cross line */}
                {isEliminated && !showFeedback && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                    className="absolute left-0 top-1/2 h-[1.5px] bg-theme-muted/40 pointer-events-none"
                    style={{ originX: 0, translateY: "-50%" }}
                  />
                )}

                {/* Feedback Icons */}
                {showFeedback && isCorrect && <CheckCircle2 className="shrink-0 text-emerald-500 w-5 h-5" />}
                {showFeedback && isSelected && !isCorrect && <XCircle className="shrink-0 text-rose-500 w-5 h-5" />}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && questionData.explanation && mode !== 'exam' && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="mcq-explanation-panel p-5 rounded-[1.1rem] space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-theme-border/30">
                <h4 className="flex items-center gap-2 font-bold text-theme-primary">
                  <Lightbulb size={18} /> Explanation
                </h4>
                
                {/* Catchy Pro AI Tutor explain button */}
                <button
                  onClick={handleAiTutorClick}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 active:scale-95 transition-all uppercase tracking-wider cursor-pointer whitespace-nowrap"
                >
                  <Sparkles size={11} className="animate-pulse" />
                  <span>AI Tutor</span>
                  {economy?.user_tier !== 'Pro' && <Lock size={10} className="ml-0.5 text-amber-500" />}
                </button>
              </div>

              {economy?.user_tier !== 'Pro' && (
                questionData.difficulty?.toLowerCase() === 'hard' ||
                (questionData.difficulty?.toLowerCase() === 'medium' && !hasImageOrVideo(questionData.explanation))
              ) ? (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <Lock className="text-amber-500 mb-2" size={24} />
                  <p className="text-theme-text font-bold mb-1">Expert Breakdown Locked</p>
                  <p className="text-xs text-theme-muted">Upgrade to Pro to see the master breakdown.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mcq-explanation-content text-theme-text leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: formatExplanationLayout(renderMathInHtmlString(questionData.explanation)).replace(/autoplay=1/g, 'autoplay=0').replace(/allow="autoplay;/g, 'allow="') }} />
                  </div>

                  {/* AI Response Area */}
                  {loadingAi && (
                    <div className="p-4 bg-theme-bg border border-theme-border rounded-xl animate-pulse text-xs font-bold text-theme-muted flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
                      AI Tutor is constructing conceptual breakdown...
                    </div>
                  )}

                  {aiError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold leading-relaxed">
                      ⚠️ {aiError}
                    </div>
                  )}
              {aiExplanation && (() => {
                     return (
                       <div className="p-5 bg-amber-500/5 border border-amber-500/25 rounded-2xl space-y-2 shadow-inner relative overflow-hidden animate-in fade-in duration-300">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                         <div className="flex justify-between items-center mb-1.5 border-b border-amber-500/10 pb-1.5 gap-2 flex-wrap">
                           <h5 className="flex items-center gap-1.5 font-black text-[11px] text-amber-600 uppercase tracking-widest">
                             <Sparkles size={12} className="text-amber-500" /> Insights
                           </h5>
                           <div className="flex items-center gap-1.5">
                             <button
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 try {
                                   const outputId = hashString(`ai-explanation-${questionData.id}`);
                                   const record = {
                                     id: outputId,
                                     mode: 'learn',
                                     title: questionData.question.replace(/<[^>]*>/g, '').substring(0, 40) + '...',
                                     html: `
                                       <div className="space-y-3">
                                         <div class="text-[11px] text-theme-muted font-black uppercase tracking-widest">MCQ Question:</div>
                                         <p class="text-xs text-theme-text font-semibold italic border-l-2 border-theme-primary/30 pl-2.5 my-2.5">${questionData.question}</p>
                                         ${aiExplanation}
                                       </div>
                                     `,
                                     mcqs: null,
                                     timestamp: new Date().toISOString()
                                   };
                                   await saveOutput(record);
                                   window.dispatchEvent(new Event('savedOutputsUpdated'));
                                   showToast('Explanation saved to AI Library!', 'success');
                                 } catch (err) {
                                   console.error(err);
                                   showToast('Failed to save explanation.', 'error');
                                 }
                               }}
                               className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 active:scale-95 transition-all uppercase tracking-wider cursor-pointer"
                             >
                               Save
                             </button>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 const outputId = hashString(`ai-explanation-${questionData.id}`);
                                 const record = {
                                   id: outputId,
                                   mode: 'learn',
                                   title: questionData.question.replace(/<[^>]*>/g, '').substring(0, 30) + '...',
                                   html: `
                                     <div className="space-y-3">
                                       <div class="text-[11px] text-theme-muted font-black uppercase tracking-widest">MCQ Question:</div>
                                       <p class="text-xs text-theme-text font-semibold italic border-l-2 border-theme-primary/30 pl-2.5 my-2.5">${questionData.question}</p>
                                       ${aiExplanation}
                                     </div>
                                   `,
                                   mcqs: null,
                                   timestamp: new Date().toISOString(),
                                   savedToDb: false
                                 };
                                 navigate('/profile', {
                                   state: {
                                     openMentor: true,
                                     mentorMode: 'learn',
                                     pipeOutput: record
                                   }
                                 });
                               }}
                               className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 active:scale-95 transition-all uppercase tracking-wider cursor-pointer"
                             >
                               Discuss
                             </button>
                           </div>
                         </div>
                          <div 
                            className="ai-insights-content text-theme-text leading-relaxed font-medium space-y-2"
                            dangerouslySetInnerHTML={{ __html: aiExplanation }}
                          />
                       </div>
                     );
                   })()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Lightbox Zoom Viewer for MCQ Images */}
      {zoomedImg && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
          onClick={(e) => {
            e.stopPropagation();
            setZoomedImg(null);
          }}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setZoomedImg(null);
            }}
          >
            <XCircle size={24} />
          </button>
          <img 
            src={zoomedImg} 
            alt="Zoomed MCQ View" 
            className="max-w-[90%] max-h-[90%] object-contain rounded-2xl shadow-2xl border border-white/5 animate-in zoom-in-95 duration-200"
          />
        </div>
      )}

    </div>
  );
}
