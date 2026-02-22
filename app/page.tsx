'use client';

import { useState, useEffect } from 'react';
import { useEntries } from './hooks/useEntries';
import LogView from './components/LogView';
import InsightsView from './components/InsightsView';
import HistoryView from './components/HistoryView';

export default function Home() {
  const [activeView, setActiveView] = useState('log');
  const [isDark, setIsDark] = useState(true);
  
  const { 
    todayEntries, 
    entriesByDate, 
    isReady,
    addEntry, 
    deleteEntry, 
    getEntriesForLastDays, 
    getStats, 
    getPatterns, 
    exportData 
  } = useEntries();

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('diet-mood-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('diet-mood-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('diet-mood-theme', 'light');
    }
  };

  if (!isReady) {
    return (
      <div id="app">
        <header className="app-header">
          <h1>🍽️ Mood</h1>
          <button 
            className="icon-btn" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDark ? '🌙' : '☀️'}
          </button>
        </header>
        <main className="main-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🍽️</div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div id="app">
      <header className="app-header">
        <h1>🍽️ Mood</h1>
        <button 
          className="icon-btn" 
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {isDark ? '🌙' : '☀️'}
        </button>
      </header>

      <main className="main-content">
        <section className={`view ${activeView === 'log' ? 'active' : ''}`}>
          <LogView 
            todayEntries={todayEntries} 
            onAddEntry={addEntry} 
          />
        </section>

        <section className={`view ${activeView === 'insights' ? 'active' : ''}`}>
          <InsightsView 
            entries={getEntriesForLastDays(7)}
            stats={getStats()}
            patterns={getPatterns()}
          />
        </section>

        <section className={`view ${activeView === 'history' ? 'active' : ''}`}>
          <HistoryView 
            entriesByDate={entriesByDate}
            onDelete={deleteEntry}
            onExport={exportData}
          />
        </section>
      </main>

      <nav className="bottom-nav">
        <button 
          className={`nav-btn ${activeView === 'log' ? 'active' : ''}`}
          onClick={() => setActiveView('log')}
        >
          <span className="nav-icon">➕</span>
          <span className="nav-label">Log</span>
        </button>
        <button 
          className={`nav-btn ${activeView === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveView('insights')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Insights</span>
        </button>
        <button 
          className={`nav-btn ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => setActiveView('history')}
        >
          <span className="nav-icon">📜</span>
          <span className="nav-label">History</span>
        </button>
      </nav>
    </div>
  );
}
