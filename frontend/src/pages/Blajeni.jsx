import { useState } from 'react';
import { Plus, Trash2, ChevronRight, ChevronLeft, StickyNote } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useGet, useAction } from '../hooks/useApi';

const COLUMNS = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' }
];
const CATEGORIES = ['general', 'construction', 'garden', 'utilities', 'interior'];

export default function Blajeni() {
  const tasks = useGet('blajeni-tasks', '/blajeni/tasks');
  const notes = useGet('blajeni-notes', '/blajeni/notes');
  const [category, setCategory] = useState('all');
  const [taskModal, setTaskModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', category: 'general', priority: 'medium' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '', category: 'general' });

  const saveTask = useAction({ url: '/blajeni/tasks', invalidate: ['blajeni-tasks'], successMessage: 'Task created' });
  const moveTask = useAction({ method: 'put', invalidate: ['blajeni-tasks'] });
  const deleteTask = useAction({ method: 'delete', invalidate: ['blajeni-tasks'] });
  const saveNote = useAction({ url: '/blajeni/notes', invalidate: ['blajeni-notes'], successMessage: 'Note saved' });

  const filtered = (tasks.data || []).filter((t) => category === 'all' || t.category === category);

  function move(task, dir) {
    const idx = COLUMNS.findIndex((c) => c.key === task.status);
    const next = COLUMNS[idx + dir];
    if (next) moveTask.mutate({ url: `/blajeni/tasks/${task.id}`, data: { status: next.key } });
  }

  if (tasks.isLoading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {['all', ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs capitalize ${category === c ? 'bg-accent text-white' : 'bg-white/[0.05] text-muted hover:bg-white/[0.08]'}`}>
            {c}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => setNoteModal(true)}><StickyNote size={14} /> Note</Button>
          <Button onClick={() => setTaskModal(true)}><Plus size={15} /> Task</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col, colIdx) => (
          <div key={col.key}>
            <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted">
              {col.label} ({filtered.filter((t) => t.status === col.key).length})
            </h3>
            <div className="space-y-2">
              {filtered.filter((t) => t.status === col.key).map((t) => (
                <Card key={t.id} className="!p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${t.status === 'done' ? 'text-muted line-through' : 'text-primary'}`}>
                        {t.title}
                      </p>
                      {t.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{t.description}</p>}
                      <div className="mt-1.5 flex gap-1.5">
                        <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] capitalize text-muted">{t.category}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${
                          t.priority === 'high' ? 'bg-red-500/15 text-red-300' :
                          t.priority === 'low' ? 'bg-gray-500/15 text-muted' : 'bg-yellow-500/15 text-yellow-300'
                        }`}>{t.priority}</span>
                      </div>
                    </div>
                    <button onClick={() => confirm('Delete task?') && deleteTask.mutate({ url: `/blajeni/tasks/${t.id}` })}
                      className="text-white/30 hover:text-red-400"><Trash2 size={13} /></button>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <button disabled={colIdx === 0} onClick={() => move(t, -1)}
                      className="text-white/30 hover:text-white/75 disabled:opacity-20"><ChevronLeft size={16} /></button>
                    <button disabled={colIdx === 2} onClick={() => move(t, 1)}
                      className="text-white/30 hover:text-white/75 disabled:opacity-20"><ChevronRight size={16} /></button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-primary">Notes</h3>
        {(notes.data || []).length === 0 ? (
          <Card className="py-6 text-center text-sm text-muted">No notes yet.</Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notes.data.map((n) => (
              <Card key={n.id}>
                <h4 className="text-sm font-medium text-primary">{n.title}</h4>
                <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-muted">{n.content}</p>
                <span className="mt-2 inline-block rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] capitalize text-muted">{n.category}</span>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="New task">
        <form onSubmit={async (e) => { e.preventDefault(); await saveTask.mutateAsync({ data: taskForm }); setTaskModal(false); }}
          className="space-y-3">
          <Input label="Title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
          <Input label="Description" as="textarea" rows={3} value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Category" as="select" value={taskForm.category}
              onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Input>
            <Input label="Priority" as="select" value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
              {['low', 'medium', 'high'].map((p) => <option key={p} value={p}>{p}</option>)}
            </Input>
          </div>
          <Button type="submit" loading={saveTask.isPending} className="w-full">Create</Button>
        </form>
      </Modal>

      <Modal open={noteModal} onClose={() => setNoteModal(false)} title="New note">
        <form onSubmit={async (e) => { e.preventDefault(); await saveNote.mutateAsync({ data: noteForm }); setNoteModal(false); }}
          className="space-y-3">
          <Input label="Title" value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} required />
          <Input label="Content" as="textarea" rows={5} value={noteForm.content}
            onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} />
          <Input label="Category" as="select" value={noteForm.category}
            onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Input>
          <Button type="submit" loading={saveNote.isPending} className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  );
}
