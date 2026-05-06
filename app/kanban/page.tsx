import KanbanBoard from './KanbanBoard';

export const metadata = {
  title: 'Kanban Board',
  description: 'Simple drag and drop todo kanban board',
};

export default function KanbanPage() {
  return <KanbanBoard />;
}
