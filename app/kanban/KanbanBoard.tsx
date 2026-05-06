'use client';

import { useState, useRef, useEffect } from 'react';

type Priority = 'low' | 'medium' | 'high';
type ColumnId = 'todo' | 'inprogress' | 'done';

interface Card {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  columnId: ColumnId;
  createdAt: number;
}

interface Column {
  id: ColumnId;
  title: string;
  color: string;
  accent: string;
}

const COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do', color: '#6366f1', accent: 'rgba(99,102,241,0.12)' },
  { id: 'inprogress', title: 'In Progress', color: '#f59e0b', accent: 'rgba(245,158,11,0.12)' },
  { id: 'done', title: 'Done', color: '#22c55e', accent: 'rgba(34,197,94,0.12)' },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Low', color: '#22c55e' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high: { label: 'High', color: '#ef4444' },
};

const STORAGE_KEY = 'kanban-cards';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadCards(): Card[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultCards();
  } catch {
    return defaultCards();
  }
}

function defaultCards(): Card[] {
  return [
    { id: generateId(), title: 'Design wireframes', description: 'Create low-fi mockups for the new dashboard', priority: 'high', columnId: 'todo', createdAt: Date.now() - 3000 },
    { id: generateId(), title: 'Write unit tests', description: '', priority: 'medium', columnId: 'todo', createdAt: Date.now() - 2000 },
    { id: generateId(), title: 'API integration', description: 'Connect frontend to the REST endpoints', priority: 'high', columnId: 'inprogress', createdAt: Date.now() - 1000 },
    { id: generateId(), title: 'Setup CI/CD', description: 'GitHub Actions pipeline', priority: 'low', columnId: 'done', createdAt: Date.now() },
  ];
}

interface AddCardModalProps {
  onAdd: (title: string, description: string, priority: Priority) => void;
  onClose: () => void;
}

function AddCardModal({ onAdd, onClose }: AddCardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), description.trim(), priority);
    onClose();
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>New Card</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Title</label>
            <input
              ref={inputRef}
              style={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Description (optional)</label>
            <textarea
              style={{ ...styles.input, height: 72, resize: 'vertical' as const }}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more details..."
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Priority</label>
            <div style={styles.priorityRow}>
              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  style={{
                    ...styles.priorityBtn,
                    background: priority === p ? PRIORITY_CONFIG[p].color : 'var(--bg-input)',
                    color: priority === p ? '#fff' : 'var(--text-secondary)',
                    borderColor: priority === p ? PRIORITY_CONFIG[p].color : 'var(--border)',
                  }}
                  onClick={() => setPriority(p)}
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={!title.trim()}
            style={{
              ...styles.submitBtn,
              opacity: title.trim() ? 1 : 0.5,
              cursor: title.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Add Card
          </button>
        </form>
      </div>
    </div>
  );
}

interface KanbanCardProps {
  card: Card;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

function KanbanCard({ card, onDelete, onDragStart }: KanbanCardProps) {
  const [hovered, setHovered] = useState(false);
  const pc = PRIORITY_CONFIG[card.priority];

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, card.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.card,
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.08)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        cursor: 'grab',
      }}
    >
      <div style={styles.cardTop}>
        <span style={{ ...styles.priorityDot, background: pc.color }} title={pc.label} />
        <span style={{ ...styles.priorityLabel, color: pc.color }}>{pc.label}</span>
        <button
          style={{ ...styles.deleteBtn, opacity: hovered ? 1 : 0 }}
          onClick={() => onDelete(card.id)}
          title="Delete card"
        >
          ✕
        </button>
      </div>
      <p style={styles.cardTitle}>{card.title}</p>
      {card.description && <p style={styles.cardDesc}>{card.description}</p>}
    </div>
  );
}

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnId: ColumnId) => void;
}

function KanbanColumn({ column, cards, onDelete, onDragStart, onDragOver, onDrop }: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      style={{
        ...styles.column,
        background: dragOver ? column.accent : 'var(--bg-secondary)',
        borderColor: dragOver ? column.color : 'var(--border)',
      }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); onDragOver(e); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { setDragOver(false); onDrop(e, column.id); }}
    >
      <div style={styles.columnHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...styles.columnDot, background: column.color }} />
          <h3 style={{ ...styles.columnTitle, color: column.color }}>{column.title}</h3>
        </div>
        <span style={styles.cardCount}>{cards.length}</span>
      </div>
      <div style={styles.cardList}>
        {cards.length === 0 && (
          <div style={styles.emptyCol}>Drop cards here</div>
        )}
        {cards.map(card => (
          <KanbanCard
            key={card.id}
            card={card}
            onDelete={onDelete}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [showModal, setShowModal] = useState(false);
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    setCards(loadCards());
  }, []);

  useEffect(() => {
    if (cards.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    }
  }, [cards]);

  function addCard(title: string, description: string, priority: Priority) {
    const card: Card = { id: generateId(), title, description, priority, columnId: 'todo', createdAt: Date.now() };
    setCards(prev => [...prev, card]);
  }

  function deleteCard(id: string) {
    setCards(prev => prev.filter(c => c.id !== id));
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDrop(e: React.DragEvent, columnId: ColumnId) {
    e.preventDefault();
    if (!dragId.current) return;
    setCards(prev =>
      prev.map(c => c.id === dragId.current ? { ...c, columnId } : c)
    );
    dragId.current = null;
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <a href="/" style={styles.backLink}>← Back</a>
          <h1 style={styles.heading}>Kanban Board</h1>
        </div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>+ Add Card</button>
      </header>

      <div style={styles.board}>
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            cards={cards.filter(c => c.columnId === col.id)}
            onDelete={deleteCard}
            onDragStart={handleDragStart}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {showModal && (
        <AddCardModal onAdd={addCard} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  backLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: 14,
  },
  heading: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  addBtn: {
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  board: {
    display: 'flex',
    gap: 16,
    padding: 24,
    overflowX: 'auto',
    flex: 1,
    alignItems: 'flex-start',
  },
  column: {
    minWidth: 280,
    flex: '1 1 280px',
    borderRadius: 14,
    border: '1.5px solid var(--border)',
    padding: 14,
    transition: 'background 0.15s, border-color 0.15s',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  columnDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    display: 'inline-block',
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  cardCount: {
    background: 'var(--bg-input)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 20,
    padding: '2px 9px',
    border: '1px solid var(--border)',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minHeight: 60,
  },
  emptyCol: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    textAlign: 'center',
    padding: '20px 0',
    border: '1.5px dashed var(--border)',
    borderRadius: 10,
    opacity: 0.7,
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '12px 14px',
    transition: 'box-shadow 0.15s, transform 0.15s',
    userSelect: 'none',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flex: 1,
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: 1,
    padding: '2px 4px',
    borderRadius: 4,
    transition: 'opacity 0.15s',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
  },
  cardDesc: {
    marginTop: 6,
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: 'var(--bg-card)',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    border: '1px solid var(--border)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 16,
    padding: 4,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  priorityRow: {
    display: 'flex',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    padding: '8px 0',
    border: '1.5px solid',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  submitBtn: {
    width: '100%',
    padding: '12px 0',
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
};
