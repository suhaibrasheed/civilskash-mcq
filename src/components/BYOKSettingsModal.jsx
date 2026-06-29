import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Eye, EyeOff, Brain, Target, GraduationCap, Search, Zap } from 'lucide-react';
import { useEconomy } from '../context/EconomyContext';
import { useToast } from '../context/ToastContext';

export default function BYOKSettingsModal({ isOpen, onClose }) {
  const { economy, toggleProTier, openProUpsell } = useEconomy();
  const { showToast } = useToast();
  
  const alert = (msg) => {
    showToast(msg, msg.toLowerCase().includes('success') ? 'success' : 'error');
  };

  const [forceFormView, setForceFormView] = useState(false);

  // If a Free user opens this modal, redirect them to the unified upsell
  useEffect(() => {
    if (isOpen && economy && economy.user_tier !== 'Pro') {
      openProUpsell('Personal AI Settings');
      onClose();
    }
  }, [isOpen, economy]);

  // AI Keys & Config States initialized on mount when modal opens
  const [aiProvider, setAiProvider] = useState('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [openrouterModel, setOpenrouterModel] = useState('google/gemini-2.5-flash');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [deepseekModel, setDeepseekModel] = useState('deepseek-chat');
  const [huggingfaceKey, setHuggingfaceKey] = useState('');
  const [huggingfaceModel, setHuggingfaceModel] = useState('mistralai/Mistral-7B-Instruct-v0.2');

  const [showKey, setShowKey] = useState(false);

  // Load latest settings from localStorage on open/mount
  useEffect(() => {
    if (isOpen) {
      setAiProvider(localStorage.getItem('civilsKash_aiProvider') || 'gemini');
      setGeminiKey(localStorage.getItem('civilsKash_geminiKey') || '');
      setGeminiModel(localStorage.getItem('civilsKash_geminiModel') || 'gemini-2.5-flash');
      setOpenaiKey(localStorage.getItem('civilsKash_openaiKey') || '');
      setOpenaiModel(localStorage.getItem('civilsKash_openaiModel') || 'gpt-4o-mini');
      setOpenrouterKey(localStorage.getItem('civilsKash_openrouterKey') || '');
      setOpenrouterModel(localStorage.getItem('civilsKash_openrouterModel') || 'google/gemini-2.5-flash');
      setDeepseekKey(localStorage.getItem('civilsKash_deepseekKey') || '');
      setDeepseekModel(localStorage.getItem('civilsKash_deepseekModel') || 'deepseek-chat');
      setHuggingfaceKey(localStorage.getItem('civilsKash_huggingfaceKey') || '');
      setHuggingfaceModel(localStorage.getItem('civilsKash_huggingfaceModel') || 'mistralai/Mistral-7B-Instruct-v0.2');
      
      setForceFormView(false);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const saveAiSettings = () => {
    localStorage.setItem('civilsKash_aiProvider', aiProvider);
    localStorage.setItem('civilsKash_geminiKey', geminiKey);
    localStorage.setItem('civilsKash_geminiModel', geminiModel);
    localStorage.setItem('civilsKash_openaiKey', openaiKey);
    localStorage.setItem('civilsKash_openaiModel', openaiModel);
    localStorage.setItem('civilsKash_openrouterKey', openrouterKey);
    localStorage.setItem('civilsKash_openrouterModel', openrouterModel);
    localStorage.setItem('civilsKash_deepseekKey', deepseekKey);
    localStorage.setItem('civilsKash_deepseekModel', deepseekModel);
    localStorage.setItem('civilsKash_huggingfaceKey', huggingfaceKey);
    localStorage.setItem('civilsKash_huggingfaceModel', huggingfaceModel);
    
    const hasKey = !!(geminiKey || openaiKey || openrouterKey || deepseekKey || huggingfaceKey);
    toggleProTier(hasKey);

    onClose();
    alert('AI keys saved successfully!');
  };

  const handleClearKeys = () => {
    if (window.confirm("Are you sure you want to clear all your saved API keys? This will reset your AI settings.")) {
      localStorage.removeItem('civilsKash_aiProvider');
      localStorage.removeItem('civilsKash_geminiKey');
      localStorage.removeItem('civilsKash_geminiModel');
      localStorage.removeItem('civilsKash_openaiKey');
      localStorage.removeItem('civilsKash_openaiModel');
      localStorage.removeItem('civilsKash_openrouterKey');
      localStorage.removeItem('civilsKash_openrouterModel');
      localStorage.removeItem('civilsKash_deepseekKey');
      localStorage.removeItem('civilsKash_deepseekModel');
      localStorage.removeItem('civilsKash_huggingfaceKey');
      localStorage.removeItem('civilsKash_huggingfaceModel');
      localStorage.removeItem('civilsKash_aiCoachPlan');
      localStorage.removeItem('civilsKash_ghostProfile');
      localStorage.removeItem('civilsKash_coachChat');

      setAiProvider('gemini');
      setGeminiKey('');
      setGeminiModel('gemini-2.5-flash');
      setOpenaiKey('');
      setOpenaiModel('gpt-4o-mini');
      setOpenrouterKey('');
      setOpenrouterModel('google/gemini-2.5-flash');
      setDeepseekKey('');
      setDeepseekModel('deepseek-chat');
      setHuggingfaceKey('');
      setHuggingfaceModel('mistralai/Mistral-7B-Instruct-v0.2');
      
      toggleProTier(false);
      onClose();
      alert('All AI keys and configurations cleared successfully.');
    }
  };

  const isPro = economy?.user_tier === 'Pro';
  const showForm = isPro || forceFormView;

  const renderUpsellView = () => {
    return (
      <div 
        className="rounded-3xl w-full max-h-[calc(100dvh-2rem)] shadow-2xl overflow-hidden flex flex-col scale-100 animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'rgba(var(--color-surface-rgb), 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-theme-border/10 bg-theme-bg/30 flex justify-between items-center">
          <h3 className="font-black text-base text-theme-text flex items-center gap-2 uppercase tracking-tight">
            <Sparkles size={16} className="text-amber-500 animate-pulse" /> Personal AI Settings
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-theme-bg text-theme-muted hover:text-theme-text transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content — fully scrollable, button lives at the bottom */}
        <div className="px-5 pt-4 pb-5 space-y-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="text-center max-w-sm mx-auto space-y-0.5">
            <h4 className="text-sm font-black text-theme-text uppercase tracking-widest text-gradient-primary">Elite AI Suite</h4>
            <p className="text-[11px] text-theme-muted font-semibold leading-relaxed">
              Unlock personalized success diagnostics and concept breakdowns.
            </p>
          </div>

          {/* Premium Bento Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Rank Detector (Spans 2 columns) */}
            <div 
              className="col-span-2 p-5 rounded-2xl flex gap-4 hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden group"
              style={{
                background: 'rgba(245, 158, 11, 0.04)',
                border: '1px solid rgba(245, 158, 11, 0.12)'
              }}
            >
              <span className="absolute top-4 right-4 text-[7px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded">Pro</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5 shadow-inner">
                <Target size={18} />
              </div>
              <div className="space-y-0.5 pr-8">
                <h5 className="font-black text-xs text-theme-text uppercase tracking-wider">
                  Rank Detector
                </h5>
                <p className="text-[11px] text-theme-muted leading-relaxed font-medium">
                  Know where you stand before the real exam does. Predict readiness, spot blindspots, and avoid unpleasant surprises on exam day.
                </p>
              </div>
            </div>

            {/* Card 2: X-Ray Analysis */}
            <div 
              className="col-span-1 p-4 rounded-2xl flex flex-col gap-3 hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden group"
              style={{
                background: 'rgba(6, 182, 212, 0.04)',
                border: '1px solid rgba(6, 182, 212, 0.12)'
              }}
            >
              <span className="absolute top-4 right-4 text-[7px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded">Pro</span>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
                <Search size={16} />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-black text-xs text-theme-text uppercase tracking-wider">
                  X-Ray Analysis
                </h5>
                <p className="text-[10px] text-theme-muted leading-relaxed font-medium">
                  Reveal the hidden gaps between your current score and your target rank. Find what ordinary performance reports never show.
                </p>
              </div>
            </div>

            {/* Card 3: Personal Mentor */}
            <div 
              className="col-span-1 p-4 rounded-2xl flex flex-col gap-3 hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden group"
              style={{
                background: 'rgba(16, 185, 129, 0.04)',
                border: '1px solid rgba(16, 185, 129, 0.12)'
              }}
            >
              <span className="absolute top-4 right-4 text-[7px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded">Pro</span>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <GraduationCap size={16} />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-black text-xs text-theme-text uppercase tracking-wider">
                  Personal Mentor
                </h5>
                <p className="text-[10px] text-theme-muted leading-relaxed font-medium">
                  Your personal AI mentor that never gets tired. Get guidance, strategy, and instant answers whenever preparation hits a roadblock.
                </p>
              </div>
            </div>

            {/* Card 4: Smart Explainer */}
            <div 
              className="col-span-1 p-4 rounded-2xl flex flex-col gap-3 hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden group"
              style={{
                background: 'rgba(249, 115, 22, 0.04)',
                border: '1px solid rgba(249, 115, 22, 0.12)'
              }}
            >
              <span className="absolute top-4 right-4 text-[7px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/25 px-2 py-0.5 rounded">Pro</span>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 shadow-inner">
                <Brain size={16} />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-black text-xs text-theme-text uppercase tracking-wider">
                  Smart Explainer
                </h5>
                <p className="text-[10px] text-theme-muted leading-relaxed font-medium">
                  Don't just see the correct answer, understand it. Master concepts, shortcuts, and memory hooks designed for competitive exams.
                </p>
              </div>
            </div>

            {/* Card 5: Mock Builder */}
            <div 
              className="col-span-1 p-4 rounded-2xl flex flex-col gap-3 hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden group"
              style={{
                background: 'rgba(168, 85, 247, 0.04)',
                border: '1px solid rgba(168, 85, 247, 0.12)'
              }}
            >
              <span className="absolute top-4 right-4 text-[7px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded">Pro</span>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
                <Zap size={16} />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-black text-xs text-theme-text uppercase tracking-wider">
                  Mock Builder
                </h5>
                <p className="text-[10px] text-theme-muted leading-relaxed font-medium">
                  Train on the questions you actually need. Create personalized mocks from your weak areas and convert weaknesses into scoring strengths.
                </p>
              </div>
            </div>
          </div>

          {/* Got It button — inside scroll body, at the bottom of cards */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl font-black text-sm tracking-widest uppercase text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
          >
            Got It
          </button>
        </div>
      </div>
    );
  };

  const renderFormView = () => {
    return (
      <div 
        className="rounded-3xl w-full max-h-[calc(100dvh-2rem)] shadow-2xl overflow-hidden flex flex-col scale-100 animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'rgba(var(--color-surface-rgb), 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-theme-border/10 bg-theme-bg/30 flex justify-between items-center">
          <h3 className="font-black text-lg text-theme-text flex items-center gap-2 uppercase tracking-tight">
            <Sparkles size={18} className="text-amber-500 animate-pulse" /> Personal AI Settings
            {isPro && (
              <span className="ml-1.5 text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                ★ Pro Active
              </span>
            )}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-theme-bg text-theme-muted hover:text-theme-text transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">Select AI Provider</label>
            <select 
              value={aiProvider} 
              onChange={(e) => setAiProvider(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-primary/20 text-theme-text"
            >
              <option value="gemini">Google Gemini API</option>
              <option value="openai">OpenAI (GPT) API</option>
              <option value="openrouter">OpenRouter API (Free models available)</option>
              <option value="deepseek">DeepSeek API</option>
              <option value="huggingface">Hugging Face Inference API</option>
            </select>
            <small className="block text-[11px] text-theme-muted font-medium leading-relaxed mt-1">
              💡 Bring Your Own Key (BYOK) means your key is stored locally on this browser session and never sent to our servers.
            </small>
          </div>

          {/* Gemini Provider Config */}
          {aiProvider === 'gemini' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">Gemini API Key</label>
                <div className="relative">
                  <input 
                    type={showKey ? 'text' : 'password'} 
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..." 
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-theme-primary pr-12 text-theme-text"
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">Gemini Model</label>
                <select 
                  value={geminiModel} 
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm font-bold text-theme-text"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Medium - Recommended)</option>
                  <option value="gemini-2.5-flash-live">Gemini 2.5 Flash Live</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Air)</option>
                  <option value="gemma-3-27b">Gemma 3 27B (Heavy)</option>
                </select>
              </div>
            </div>
          )}

          {/* OpenAI Provider Config */}
          {aiProvider === 'openai' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">OpenAI API Key</label>
                <div className="relative">
                  <input 
                    type={showKey ? 'text' : 'password'} 
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..." 
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-theme-primary pr-12 text-theme-text"
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">Model ID</label>
                <input 
                  type="text" 
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  placeholder="e.g. gpt-4o-mini" 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-theme-primary text-theme-text"
                />
              </div>
            </div>
          )}

          {/* OpenRouter Provider Config */}
          {aiProvider === 'openrouter' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">OpenRouter API Key</label>
                <div className="relative">
                  <input 
                    type={showKey ? 'text' : 'password'} 
                    value={openrouterKey}
                    onChange={(e) => setOpenrouterKey(e.target.value)}
                    placeholder="sk-or-..." 
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-theme-primary pr-12 text-theme-text"
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">Model Path</label>
                <input 
                  type="text" 
                  value={openrouterModel}
                  onChange={(e) => setOpenrouterModel(e.target.value)}
                  placeholder="e.g. google/gemini-2.5-flash" 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-theme-primary text-theme-text"
                />
              </div>
            </div>
          )}

          {/* DeepSeek Provider Config */}
          {aiProvider === 'deepseek' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">DeepSeek API Key</label>
                <div className="relative">
                  <input 
                    type={showKey ? 'text' : 'password'} 
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    placeholder="sk-..." 
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-theme-primary pr-12 text-theme-text"
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">Model ID</label>
                <select 
                  value={deepseekModel} 
                  onChange={(e) => setDeepseekModel(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm font-bold text-theme-text"
                >
                  <option value="deepseek-chat">deepseek-chat (DeepSeek-V3 - Recommended)</option>
                  <option value="deepseek-reasoner">deepseek-reasoner (DeepSeek-R1)</option>
                </select>
              </div>
            </div>
          )}

          {/* HuggingFace Provider Config */}
          {aiProvider === 'huggingface' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">Hugging Face Token</label>
                <div className="relative">
                  <input 
                    type={showKey ? 'text' : 'password'} 
                    value={huggingfaceKey}
                    onChange={(e) => setHuggingfaceKey(e.target.value)}
                    placeholder="hf_..." 
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-theme-primary pr-12 text-theme-text"
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-theme-muted">Inference Model URL Path</label>
                <input 
                  type="text" 
                  value={huggingfaceModel}
                  onChange={(e) => setHuggingfaceModel(e.target.value)}
                  placeholder="e.g. mistralai/Mistral-7B-Instruct-v0.2" 
                  className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-theme-primary text-theme-text"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-theme-border/10 flex gap-3 bg-theme-surface">
          {!isPro && (
            <button 
              onClick={() => setForceFormView(false)} 
              className="px-4 py-3 rounded-xl font-bold bg-theme-bg text-theme-muted border border-theme-border/50 text-xs shrink-0 hover:text-theme-text transition-colors"
            >
              Back to Info
            </button>
          )}
          {isPro && (
            <button 
              onClick={handleClearKeys} 
              className="px-4 py-3 rounded-xl font-bold bg-rose-500/10 text-rose-500 border border-rose-500/25 hover:bg-rose-500/20 text-xs shrink-0 transition-colors"
            >
              Clear Keys
            </button>
          )}
          <button 
            onClick={onClose} 
            className="flex-1 py-3 px-4 rounded-xl font-bold text-theme-text bg-theme-bg border border-theme-border/50 text-xs hover:bg-theme-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={saveAiSettings} 
            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-theme-primary hover:opacity-90 text-xs shadow-md transition-all active:scale-95"
          >
            Save Keys
          </button>
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[99999] overflow-y-auto flex items-start justify-center p-3 py-4">
      <div className="w-full max-w-xl my-auto">
        {showForm ? renderFormView() : renderUpsellView()}
      </div>
    </div>,
    document.body
  );
}
