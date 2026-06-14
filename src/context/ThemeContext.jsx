import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('civilskash-theme') || 'dark';
  });

  // Initialize text size from localStorage
  const [textSize, setTextSize] = useState(() => {
    return localStorage.getItem('civilskash-textsize') || 'md';
  });

  useEffect(() => {
    console.log("Theme changing to:", theme);
    
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark', 'theme-sepia');
    html.classList.add(`theme-${theme}`);
    
    localStorage.setItem('civilskash-theme', theme);
  }, [theme]);

  useEffect(() => {
    const html = document.documentElement;
    html.className = html.className.replace(/\btext-size-\w+\b/g, '').trim();
    html.classList.add(`text-size-${textSize}`);
    
    localStorage.setItem('civilskash-textsize', textSize);
  }, [textSize]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, textSize, setTextSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
