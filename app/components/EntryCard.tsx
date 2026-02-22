'use client';

import { useState } from 'react';
import { Entry } from '../lib/types';

interface EntryCardProps {
  entry: Entry;
  onDelete?: (id: number) => void;
}

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄'
};

export default function EntryCard({ entry, onDelete }: EntryCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  
  const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  // Format the date (e.g., "Mon, Feb 23" or "Yesterday" or "Today")
  const formatDate = (dateStr: string) => {
    const entryDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset times for accurate date comparison
    const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (entryDateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (entryDateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return entryDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const dateLabel = formatDate(entry.date);

  // Calculate total calories
  const totalCalories = entry.foods?.reduce((sum, f) => sum + (f.calories || 0), 0) || 0;

  return (
    <>
      {/* Summary Card */}
      <div 
        className="entry-card" 
        onClick={() => setShowDetail(true)}
        style={{ cursor: 'pointer' }}
      >
        {onDelete && entry.id && (
          <button 
            className="entry-delete" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(entry.id!);
            }}
            aria-label="Delete entry"
          >
            ×
          </button>
        )}
        
        <div className="entry-header">
          <span className="entry-time">{dateLabel} • {time}</span>
          <span className="entry-mood">{MOOD_EMOJIS[entry.mood]}</span>
        </div>

        <div className="entry-food">{entry.food}</div>
        
        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span>⚡ {entry.energy}/10</span>
          {totalCalories > 0 && <span>🔥 {totalCalories} cal</span>}
          {entry.foods && entry.foods.length > 0 && (
            <span>📷 {entry.foods.filter(f => f.photo).length} photos</span>
          )}
        </div>

        {entry.symptoms.length > 0 && (
          <div className="entry-symptoms">
            {entry.symptoms.slice(0, 3).map(s => (
              <span key={s} className="symptom-pill">
                {s.replace('-', ' ')}
              </span>
            ))}
            {entry.symptoms.length > 3 && (
              <span className="symptom-pill">+{entry.symptoms.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setShowDetail(false)}
        >
          <div 
            style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid var(--border)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20 }}>
                  {MOOD_EMOJIS[entry.mood]} {entry.food}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                  {new Date(entry.timestamp).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button 
                onClick={() => setShowDetail(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 24,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {/* Stats Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 12, 
              marginBottom: 20,
              padding: 16,
              background: 'var(--bg-input)',
              borderRadius: 12
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{MOOD_EMOJIS[entry.mood]}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mood</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{entry.energy}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Energy</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4, color: 'var(--accent)' }}>
                  {totalCalories > 0 ? `${totalCalories}` : '-'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Calories</div>
              </div>
            </div>

            {/* Food Photos & Details */}
            {entry.foods && entry.foods.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-secondary)' }}>
                  Analyzed Foods
                </h4>
                {entry.foods.map((food, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 12,
                      background: 'var(--bg-input)',
                      borderRadius: 12,
                      marginBottom: 10
                    }}
                  >
                    {food.photo && (
                      <img 
                        src={food.photo}
                        alt={food.name}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{food.name}</div>
                      {food.calories && food.calories > 0 && (
                        <div style={{ fontSize: 13, color: 'var(--accent)' }}>
                          🔥 {food.calories} calories
                        </div>
                      )}
                      {food.ingredients && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                          <strong>Ingredients:</strong> {food.ingredients}
                        </div>
                      )}
                      {food.aiNotes && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 4 }}>
                          💡 {food.aiNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Symptoms */}
            {entry.symptoms.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-secondary)' }}>
                  Symptoms
                </h4>
                <div className="entry-symptoms">
                  {entry.symptoms.map(s => (
                    <span key={s} className="symptom-pill">
                      {s.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {entry.notes && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-secondary)' }}>
                  Notes
                </h4>
                <div style={{ 
                  padding: 12, 
                  background: 'var(--bg-input)', 
                  borderRadius: 12,
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)'
                }}>
                  "{entry.notes}"
                </div>
              </div>
            )}

            {/* Close Button */}
            <button 
              className="primary-btn"
              onClick={() => setShowDetail(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
