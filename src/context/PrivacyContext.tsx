import React, { createContext, useContext, useState, useEffect } from 'react';

interface PrivacyContextType {
  showSensitiveData: boolean;
  toggleSensitiveData: () => void;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  setFontSize: (size: 'sm' | 'base' | 'lg' | 'xl') => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [showSensitiveData, setShowSensitiveData] = useState(() => {
    const saved = localStorage.getItem('nexus_show_sensitive');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>(() => {
    const saved = localStorage.getItem('nexus_font_size');
    return (saved as 'sm' | 'base' | 'lg' | 'xl') || 'base';
  });

  useEffect(() => {
    localStorage.setItem('nexus_show_sensitive', JSON.stringify(showSensitiveData));
  }, [showSensitiveData]);

  useEffect(() => {
    localStorage.setItem('nexus_font_size', fontSize);
    document.documentElement.style.fontSize = fontSize === 'sm' ? '14px' : fontSize === 'base' ? '16px' : fontSize === 'lg' ? '18px' : '20px';
  }, [fontSize]);

  const toggleSensitiveData = () => setShowSensitiveData(prev => !prev);

  return (
    <PrivacyContext.Provider value={{ showSensitiveData, toggleSensitiveData, fontSize, setFontSize }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}

export function PrivacyMask({ value, className = "", placeholder = "••••••" }: { value: React.ReactNode, className?: string, placeholder?: string }) {
  const { showSensitiveData } = usePrivacy();
  
  if (showSensitiveData) {
    return <span className={className}>{value}</span>;
  }
  
  return <span className={`font-mono text-zinc-400 select-none blur-[2px] ${className}`}>{placeholder}</span>;
}
