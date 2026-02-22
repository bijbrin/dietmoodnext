'use client';

import { useState, useRef, useEffect } from 'react';
import { Entry, FoodItem } from '../lib/types';
import EntryCard from './EntryCard';

interface LogViewProps {
  todayEntries: Entry[];
  onAddEntry: (entry: Omit<Entry, 'id' | 'timestamp' | 'date'>) => Promise<number>;
}

const MOODS = [
  { value: 1, emoji: '😢' },
  { value: 2, emoji: '😕' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😄' }
];

const SYMPTOMS = [
  { id: 'bloating', label: 'Bloating' },
  { id: 'brain-fog', label: 'Brain fog' },
  { id: 'anxiety', label: 'Anxiety' },
  { id: 'cravings', label: 'Cravings' },
  { id: 'energy-crash', label: 'Energy crash' }
];

export default function LogView({ todayEntries, onAddEntry }: LogViewProps) {
  const [mood, setMood] = useState<number | null>(null);
  const [foodInput, setFoodInput] = useState('');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [energy, setEnergy] = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [aiRaw, setAiRaw] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const showToastMsg = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch {
      fileInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    stopCamera();
    processPhoto(canvas.toDataURL("image/jpeg", 0.8));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => processPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // AI Analysis via server-side API
  const processPhoto = async (photoData: string) => {
    setAnalyzing(true);
    setAiRaw('');
    const id = Date.now().toString();
    
    setFoods(prev => [...prev, { 
      id, 
      name: "🔍 Analyzing...", 
      photo: photoData 
    }]);

    try {
      // Call local API route (server-side will call Kimi)
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: photoData }),
      });

      const responseText = await res.text();
      setAiRaw(responseText);

      if (!res.ok) {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.error || `API error: ${res.status}`);
      }

      const parsed = JSON.parse(responseText);

      setFoods(prev => prev.map(f => 
        f.id === id ? {
          ...f,
          name: parsed.foodName,
          ingredients: parsed.ingredients,
          calories: parsed.calories,
          aiNotes: parsed.notes
        } : f
      ));

      setFoodInput(prev => prev ? `${prev}, ${parsed.foodName}` : parsed.foodName);
      showToastMsg(`✓ ${parsed.foodName} (${parsed.calories} cal)`);

    } catch (err: any) {
      console.error('Analysis error:', err);
      setFoods(prev => prev.map(f => 
        f.id === id ? { ...f, name: `❌ ${err.message.slice(0, 50)}` } : f
      ));
      showToastMsg("Analysis failed - check server");
    }
    setAnalyzing(false);
  };

  const removeFood = (id: string) => {
    setFoods(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    // Filter out placeholder/error foods and those without actual names
    const validFoods = foods.filter(f => 
      f.name && 
      !f.name.startsWith('🔍') && 
      !f.name.startsWith('❌') &&
      f.name !== 'Analyzing...'
    );
    
    const foodText = foodInput.trim() || validFoods.map(f => f.name).join(", ");
    
    if (!mood) {
      showToastMsg('Please select a mood');
      return;
    }

    if (!foodText && validFoods.length === 0) {
      showToastMsg('Please enter what you ate or wait for analysis to complete');
      return;
    }

    try {
      console.log('Saving entry:', { mood, food: foodText, foods: validFoods, energy, symptoms: selectedSymptoms, notes });
      
      await onAddEntry({
        mood,
        food: foodText,
        foods: validFoods,
        energy,
        symptoms: [...selectedSymptoms],
        notes: notes.trim()
      });

      setMood(null);
      setFoodInput('');
      setFoods([]);
      setEnergy(5);
      setSelectedSymptoms([]);
      setNotes('');
      setAiRaw('');
      showToastMsg('Entry saved!');
    } catch (err) {
      console.error('Save error:', err);
      showToastMsg('Failed to save entry - check console');
    }
  };

  return (
    <>
      {/* Mood Selector */}
      <div className="quick-log-card">
        <h2>How are you feeling?</h2>
        <div className="mood-selector">
          {MOODS.map(({ value, emoji }) => (
            <button
              key={value}
              className={`mood-btn ${mood === value ? 'selected' : ''}`}
              onClick={() => setMood(value)}
              aria-label={`Mood ${value}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Food Section with Camera */}
      <div className="log-form">
        <div className="input-group">
          <label>What did you eat?</label>
          <input
            type="text"
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
            placeholder="e.g., Avocado toast, coffee..."
          />
        </div>

        {/* Analyzed Food Items */}
        {foods.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {foods.map((food) => (
              <div 
                key={food.id} 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: 12,
                  background: 'var(--bg-input)',
                  borderRadius: 12,
                  marginBottom: 10,
                  border: '1px solid var(--border)'
                }}
              >
                {food.photo && (
                  <img 
                    src={food.photo} 
                    alt="" 
                    style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                  />
                )}
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                    {food.name}
                  </div>
                  
                  {food.calories && food.calories > 0 && (
                    <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, marginBottom: 4 }}>
                      🔥 {food.calories} calories
                    </div>
                  )}
                  
                  {food.ingredients && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      <strong>Ingredients:</strong> {food.ingredients}
                    </div>
                  )}
                  
                  {food.aiNotes && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      💡 {food.aiNotes}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => removeFood(food.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--danger)',
                    fontSize: 20,
                    cursor: 'pointer',
                    padding: 4
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Camera Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={startCamera}
            disabled={analyzing}
            className="primary-btn"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            📷 {analyzing ? 'Analyzing...' : 'Scan Food (Kimi)'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="secondary-btn"
            title="Upload from gallery"
          >
            🖼️
          </button>
        </div>

        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          onChange={handleFile} 
          style={{ display: 'none' }} 
        />

        {/* AI Debug Output */}
        {aiRaw && (
          <div style={{ 
            marginBottom: 16, 
            padding: 10, 
            background: 'var(--bg-input)', 
            borderRadius: 8,
            border: '1px dashed var(--border)'
          }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              AI Response (Debug):
            </label>
            <pre style={{ 
              fontSize: 10, 
              color: 'var(--text-secondary)', 
              overflow: 'auto',
              maxHeight: 100,
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {aiRaw}
            </pre>
          </div>
        )}

        {/* Energy Slider */}
        <div className="energy-slider">
          <label>Energy level: {energy}/10</label>
          <input
            type="range"
            min="1"
            max="10"
            value={energy}
            onChange={(e) => setEnergy(parseInt(e.target.value))}
          />
        </div>

        {/* Symptoms */}
        <div className="symptoms-tags">
          <label>Any symptoms?</label>
          <div className="tag-list">
            {SYMPTOMS.map(({ id, label }) => (
              <button
                key={id}
                className={`symptom-tag ${selectedSymptoms.includes(id) ? 'selected' : ''}`}
                onClick={() => toggleSymptom(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="input-group">
          <label>Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did you feel after? Any observations?"
          />
        </div>

        <button className="primary-btn" onClick={handleSubmit}>
          Log Entry
        </button>
      </div>

      {/* Today's Entries */}
      <div className="recent-entries">
        <h3>Today</h3>
        {todayEntries.length === 0 ? (
          <p className="empty-state">No entries yet today</p>
        ) : (
          todayEntries.map(entry => (
            <EntryCard key={entry.id} entry={entry} />
          ))
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <button 
            onClick={stopCamera}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer'
            }}
          >
            ×
          </button>
          <div style={{ padding: 32, background: '#000', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={capturePhoto}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: '4px solid rgba(255,255,255,0.3)',
                background: '#fff',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
