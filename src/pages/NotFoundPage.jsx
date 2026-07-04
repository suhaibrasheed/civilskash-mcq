import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, HelpCircle } from 'lucide-react';
import Header from '../components/Header';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-theme-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-theme-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10 text-center max-w-md mx-auto">
        <div className="w-24 h-24 rounded-full bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center mb-8 animate-bounce-slow text-theme-primary">
          <HelpCircle size={48} />
        </div>

        <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-theme-primary to-theme-accent tracking-tighter mb-4">
          404
        </h1>
        
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-3">
          Page Not Found
        </h2>
        
        <p className="text-sm text-theme-muted font-semibold leading-relaxed mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back on track!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            to="/"
            className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-theme-primary to-theme-accent text-white font-black text-xs md:text-sm uppercase tracking-widest shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Home size={16} />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex-1 py-4 px-6 rounded-xl border border-theme-border hover:border-theme-primary/30 text-theme-text font-black text-xs md:text-sm uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 bg-theme-bg/50 backdrop-blur-sm active:scale-98"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </main>
    </div>
  );
}
