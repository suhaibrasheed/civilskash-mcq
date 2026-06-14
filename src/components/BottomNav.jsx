import React from 'react';
import { Home, Compass, ShoppingBag, BookOpen, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BottomNav() {
  const navItems = [
    { icon: Home, label: 'Home', active: true, to: '/' },
    { icon: Compass, label: 'Browse', active: false, to: '/' },
    { icon: ShoppingBag, label: 'Store', active: false, to: '/' },
    { icon: BookOpen, label: 'My Course', active: false, to: '/' },
    { icon: User, label: 'Profile', active: false, to: '/' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-theme-bg border-t border-theme-border md:hidden px-4 pb-safe pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item, idx) => (
          <Link key={idx} to={item.to} className={`flex flex-col items-center p-2 min-w-[64px] transition-colors ${item.active ? 'text-theme-primary' : 'text-theme-muted hover:text-theme-text'}`}>
            <item.icon size={20} className="mb-1" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
