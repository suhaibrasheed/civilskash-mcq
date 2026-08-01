import React, { useEffect } from 'react';

/**
 * Ultra-lightweight, zero-latency page entry transition wrapper for MCQ Kash.
 * Mounts instantly on route navigation without blocking main thread.
 */
export default function PageTransition({ children }) {
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="w-full min-h-screen animate-fadeIn">
      {children}
    </div>
  );
}
