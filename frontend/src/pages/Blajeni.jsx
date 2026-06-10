import { useState } from 'react';
import TiltCard from '../components/ui/TiltCard.jsx';
import JIcon from '../components/ui/JIcon.jsx';
import { useGet, useAction } from '../hooks/useApi';
import api from '../api/client';
import { useQueryClient } from '@tanstack/react-query';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function Blajeni() {
  const { data: tasks, isLoading: tasksLoading } = useGet('blajeni-tasks', '/api/blajeni/tasks');
  const { data: notes } = useGet('blajeni-notes', '/api/blajeni/notes');
  const qc = useQueryClient();
  const saveTask = useAction({ method: 'post', url: '/api/blajeni/tasks', invalidate: ['blajeni-tasks'] });
  const saveNote = useAction({ method: 'post', url: '/api/blajeni/notes', invalidate: ['blajeni-notes'] });
  const [showTask, setShowTask] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', status: 'todo' });
  const [noteContent, setNoteContent] = useState('');

  async function move(task, dir) {
    const idx = COLUMNS.findIndex(c => c.key === task.status);
    const next = COLUMNS[idx + dir];
    if (!next) return;
    await api.put(`/api/blajeni/tasks/${task.id}`, { status: next.key });
    qc.invalidateQueries({ queryKey: ['blajeni-tasks'] });
  }

  const submitTask = async (e) => {
    e.preventDefault();
    await saveTask.mutateAsync({ data: taskForm });
    setTaskForm({ title: '', priority: 'medium', status: 'todo' });
    setShowTask(false);
  };

  const submitNote = async (e) => {
    e.preventDefault();
    await saveNote.mutateAsync({ data: { content: noteContent } });
    setNoteContent('');
    setShowNote(false);
  };

  return (
    <div className="j-screen j-screen-col">
      {/* Header actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <button className="j-btn j-btn-primary j-btn-sm" onClick={() => setShowTask(s => !s)}>
          <JIcon name="plus" size={13} /> Task
        </button>
        <button className="j-btn j-btn-ghost j-btn-sm" onClick={() => setShowNote(s => !s)}>
          <JIcon name="notes" size={13} /> Note
        </button>
      </div>

      {showTask && (
        <TiltCard className="j-card j-panel">
          <form onSubmit={submitTask} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="j-input-group">
              <label className="j-label">Task title</label>
              <input className="j-input" value={taskForm.title} onChange={e => setTaskForm(f => ({...f, title: e.target.value}))} required placeholder="e.g. Install fence posts" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="j-input-group" style={{ flex: 1 }}>
                <label className="j-label">Priority</label>
                <select className="j-input" value={taskForm.priority} onChange={e => setTaskForm(f => ({...f, priority: e.target.value}))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="j-input-group" style={{ flex: 1 }}>
                <label className="j-label">Status</label>
                <select className="j-input" value={taskForm.status} onChange={e => setTaskForm(f => ({...f, status: e.target.value}))}>
                  {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <button className="j-btn j-btn-primary j-btn-sm" type="submit">Create task</button>
          </form>
        </TiltCard>
      )}

      {showNote && (
        <TiltCard className="j-card j-panel">
          <form onSubmit={submitNote} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="j-input-group">
              <label className="j-label">Note</label>
              <textarea className="j-input" rows={4} value={noteContent} onChange={e => setNoteContent(e.target.value)} required placeholder="Write a note about the house project…" style={{ resize: 'vertical' }} />
            </div>
            <button className="j-btn j-btn-primary j-btn-sm" type="submit">Save note</button>
          </form>
        </TiltCard>
      )}

      {/* Kanban */}
      <div className="j-kanban">
        {COLUMNS.map((col, colIdx) => {
          const colTasks = (tasks || []).filter(t => t.status === col.key);
          return (
            <div key={col.key} className="j-kanban-col">
              <h3>{col.label} <span style={{ color: 'var(--dim)' }}>({colTasks.length})</span></h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasksLoading && colIdx === 0 && [1,2].map(i => <div key={i} className="j-skel" style={{ height: 70 }} />)}
                {colTasks.map(t => (
                  <TiltCard key={t.id} className="j-card j-task">
                    <div className={`j-task-title${t.status === 'done' ? ' done' : ''}`}>{t.title}</div>
                    <div className="j-task-arrows">
                      <button disabled={colIdx === 0} onClick={() => move(t, -1)}>←</button>
                      <span className={`j-badge j-badge-${t.priority || 'low'}`}>{t.priority}</span>
                      <button disabled={colIdx === COLUMNS.length - 1} onClick={() => move(t, 1)}>→</button>
                    </div>
                  </TiltCard>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {(notes || []).length > 0 && (
        <>
          <div className="j-sec-title" style={{ marginTop: 8 }}>
            <JIcon name="notes" size={12} /> HOUSE NOTES
          </div>
          <div className="j-notes-grid">
            {notes.map(n => (
              <TiltCard key={n.id} className="j-card j-note">
                <p style={{ color: 'var(--dim)', fontSize: 14, whiteSpace: 'pre-wrap', WebkitLineClamp: 5, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.content}</p>
                <span className="j-note-date">{n.created_at?.slice(0,10)}</span>
              </TiltCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
