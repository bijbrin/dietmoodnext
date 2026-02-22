'use client';

import { Entry } from '../lib/types';
import EntryCard from './EntryCard';

interface HistoryViewProps {
  entriesByDate: Record<string, Entry[]>;
  onDelete: (id: number) => void;
  onExport: () => void;
}

export default function HistoryView({ entriesByDate, onDelete, onExport }: HistoryViewProps) {
  const sortedDates = Object.keys(entriesByDate).sort().reverse();

  return (
    <>
      <div className="history-header">
        <h2>Your History</h2>
        <button className="secondary-btn" onClick={onExport}>
          Export Data
        </button>
      </div>

      {sortedDates.length === 0 ? (
        <p className="empty-state">No entries yet. Start logging! 🍽️</p>
      ) : (
        sortedDates.map(date => {
          const dateLabel = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          });

          return (
            <div key={date} className="day-group">
              <h4>{dateLabel}</h4>
              {entriesByDate[date].map(entry => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onDelete={onDelete}
                />
              ))}
            </div>
          );
        })
      )}
    </>
  );
}
