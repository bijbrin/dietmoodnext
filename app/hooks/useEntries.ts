'use client';

import { useState, useEffect, useCallback } from 'react';
import { Entry, Stats, Pattern } from '../lib/types';

const DB_NAME = 'DietMoodDB';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

export function useEntries() {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Initialize IndexedDB
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open database');
    };

    request.onsuccess = () => {
      setDb(request.result);
      setIsReady(true);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }
    };
  }, []);

  // Load all entries
  const loadEntries = useCallback(() => {
    if (!db) return;

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      setEntries(request.result.reverse());
    };
  }, [db]);

  useEffect(() => {
    if (isReady) {
      loadEntries();
    }
  }, [isReady, loadEntries]);

  // Add entry
  const addEntry = useCallback((entry: Omit<Entry, 'id' | 'timestamp' | 'date'>): Promise<number> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not ready'));
        return;
      }

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const entryWithMeta: Entry = {
        ...entry,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0]
      };

      const request = store.add(entryWithMeta);
      request.onsuccess = () => {
        loadEntries();
        resolve(request.result as number);
      };
      request.onerror = () => reject(request.error);
    });
  }, [db, loadEntries]);

  // Delete entry
  const deleteEntry = useCallback((id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not ready'));
        return;
      }

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        loadEntries();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }, [db, loadEntries]);

  // Get entries for last N days
  const getEntriesForLastDays = useCallback((days: number): Entry[] => {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return entries.filter(e => e.timestamp >= cutoff);
  }, [entries]);

  // Get today's entries
  const todayEntries = entries.filter(e => e.date === new Date().toISOString().split('T')[0]);

  // Calculate stats
  const getStats = useCallback((): Stats => {
    const recent = getEntriesForLastDays(30);
    if (recent.length === 0) {
      return { avgMood: '-', avgEnergy: '-', total: 0 };
    }

    const avgMood = recent.reduce((sum, e) => sum + e.mood, 0) / recent.length;
    const avgEnergy = recent.reduce((sum, e) => sum + e.energy, 0) / recent.length;

    return {
      avgMood: avgMood.toFixed(1),
      avgEnergy: avgEnergy.toFixed(1),
      total: recent.length
    };
  }, [getEntriesForLastDays]);

  // Detect patterns
  const getPatterns = useCallback((): Pattern[] => {
    const recent = getEntriesForLastDays(14);
    const patterns: Pattern[] = [];

    // Coffee pattern
    const coffeeEntries = recent.filter(e => 
      e.food.toLowerCase().includes('coffee') || 
      e.food.toLowerCase().includes('caffeine')
    );
    if (coffeeEntries.length >= 3) {
      const avgEnergy = coffeeEntries.reduce((s, e) => s + e.energy, 0) / coffeeEntries.length;
      patterns.push({
        icon: '☕',
        title: 'Coffee Pattern',
        desc: avgEnergy > 6 ? 'Coffee seems to boost your energy' : 'Coffee may not be helping your energy'
      });
    }

    // Sugar pattern
    const sugarEntries = recent.filter(e => 
      e.food.toLowerCase().includes('sugar') || 
      e.food.toLowerCase().includes('sweet') ||
      e.food.toLowerCase().includes('cake') ||
      e.food.toLowerCase().includes('candy')
    );
    if (sugarEntries.length >= 2) {
      const crashCount = sugarEntries.filter(e => e.symptoms.includes('energy-crash')).length;
      if (crashCount > 0) {
        patterns.push({
          icon: '🍬',
          title: 'Sugar & Energy Crashes',
          desc: `${crashCount}/${sugarEntries.length} sugary foods led to energy crashes`
        });
      }
    }

    // Best mood foods
    const moodByFood: Record<string, { moods: number[], count: number }> = {};
    recent.forEach(e => {
      const key = e.food.toLowerCase().trim();
      if (!moodByFood[key]) moodByFood[key] = { moods: [], count: 0 };
      moodByFood[key].moods.push(e.mood);
      moodByFood[key].count++;
    });

    const goodMoodFoods = Object.entries(moodByFood)
      .filter(([_, data]) => data.count >= 2 && (data.moods.reduce((a, b) => a + b, 0) / data.moods.length) >= 4)
      .map(([food, _]) => food);

    if (goodMoodFoods.length > 0) {
      patterns.push({
        icon: '🌟',
        title: 'Mood Boosters',
        desc: `You tend to feel good after: ${goodMoodFoods.slice(0, 2).join(', ')}`
      });
    }

    return patterns;
  }, [getEntriesForLastDays]);

  // Export data
  const exportData = useCallback(() => {
    const data = {
      exportDate: new Date().toISOString(),
      entries
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diet-mood-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, Entry[]>);

  return {
    entries,
    todayEntries,
    entriesByDate,
    isReady,
    addEntry,
    deleteEntry,
    getEntriesForLastDays,
    getStats,
    getPatterns,
    exportData
  };
}
