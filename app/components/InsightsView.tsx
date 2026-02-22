'use client';

import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Entry, Stats, Pattern } from '../lib/types';

Chart.register(...registerables);

interface InsightsViewProps {
  entries: Entry[];
  stats: Stats;
  patterns: Pattern[];
}

const MOOD_EMOJIS = ['', '😢', '😕', '😐', '🙂', '😄'];

export default function InsightsView({ entries, stats, patterns }: InsightsViewProps) {
  const moodChartRef = useRef<HTMLCanvasElement>(null);
  const energyChartRef = useRef<HTMLCanvasElement>(null);
  const moodChartInstance = useRef<Chart | null>(null);
  const energyChartInstance = useRef<Chart | null>(null);
  const [isDark, setIsDark] = useState(true);

  // Detect theme using .dark class
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // Listen for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!moodChartRef.current || !energyChartRef.current) return;

    // Destroy existing charts
    if (moodChartInstance.current) moodChartInstance.current.destroy();
    if (energyChartInstance.current) energyChartInstance.current.destroy();

    if (entries.length === 0) return;

    // Get colors based on theme
    const textColor = isDark ? '#a0a0b0' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const emptyColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const pointBorderColor = isDark ? '#252542' : '#ffffff';

    // Prepare data
    const byDate: Record<string, { mood: number[], energy: number[] }> = {};
    const last7Days: { date: string; label: string }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      byDate[dateStr] = { mood: [], energy: [] };
      last7Days.push({ date: dateStr, label });
    }

    entries.forEach(entry => {
      if (byDate[entry.date]) {
        byDate[entry.date].mood.push(entry.mood);
        byDate[entry.date].energy.push(entry.energy);
      }
    });

    const moodData = last7Days.map(d => {
      const moods = byDate[d.date].mood;
      return moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
    });

    const energyData = last7Days.map(d => {
      const energies = byDate[d.date].energy;
      return energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : null;
    });

    const labels = last7Days.map(d => d.label);

    // Mood Chart
    moodChartInstance.current = new Chart(moodChartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Mood',
          data: moodData,
          borderColor: '#6366f1',
          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.15)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: pointBorderColor,
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            min: 1,
            max: 5,
            ticks: {
              callback: function(value) {
                return MOOD_EMOJIS[Number(value)] || '';
              },
              color: textColor,
              font: { size: 14 }
            },
            grid: { color: gridColor }
          },
          x: {
            ticks: { color: textColor },
            grid: { display: false }
          }
        },
        plugins: { legend: { display: false } }
      }
    });

    // Energy Chart
    energyChartInstance.current = new Chart(energyChartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Energy',
          data: energyData,
          backgroundColor: energyData.map(v => {
            if (v === null) return emptyColor;
            if (v >= 7) return '#22c55e';
            if (v >= 4) return '#f59e0b';
            return '#ef4444';
          }),
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            min: 0,
            max: 10,
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          x: {
            ticks: { color: textColor },
            grid: { display: false }
          }
        },
        plugins: { legend: { display: false } }
      }
    });

    return () => {
      if (moodChartInstance.current) moodChartInstance.current.destroy();
      if (energyChartInstance.current) energyChartInstance.current.destroy();
    };
  }, [entries, isDark]);

  return (
    <>
      <div className="chart-card">
        <h3>Mood Trend (7 Days)</h3>
        {entries.length > 0 ? (
          <canvas ref={moodChartRef} />
        ) : (
          <p className="empty-state">No data yet</p>
        )}
      </div>

      <div className="chart-card">
        <h3>Energy Levels</h3>
        {entries.length > 0 ? (
          <canvas ref={energyChartRef} />
        ) : (
          <p className="empty-state">No data yet</p>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.avgMood}</span>
          <span className="stat-label">Avg Mood</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.avgEnergy}</span>
          <span className="stat-label">Avg Energy</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Entries</span>
        </div>
      </div>

      <div className="patterns-card">
        <h3>Patterns</h3>
        {patterns.length === 0 ? (
          <p className="empty-state">Log more entries to see patterns</p>
        ) : (
          patterns.map((p, i) => (
            <div key={i} className="pattern-item">
              <span className="pattern-icon">{p.icon}</span>
              <div className="pattern-text">
                <strong>{p.title}</strong>
                <span>{p.desc}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
