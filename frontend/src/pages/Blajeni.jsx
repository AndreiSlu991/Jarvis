import { useState } from 'react';
import TiltCard from '../components/ui/TiltCard.jsx';
import JIcon from '../components/ui/JIcon.jsx';
import { useGet, useAction } from '../hooks/useApi';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

const PRIORITIES = ['low', 'medium', 'high'];

function priorityBadgeClass(p) {
  if (p === 'high') return 'j-badge high';
  if (p === 'low') return 'j-badge low';
  return 'j-badge medium';
}

export default function Blajeni() {
  const tasks = useGet(['blajeni-tasks'], '/blajeni/tasks');
  const notes = useGet(['blajeni-notes'], '/blajeni/notes');

  const saveTask = useAction({ url: '/blajeni/tasks', invalidate: [['blajeni-tasks']], successMessage: 'Task created' });
  const moveTask = useAction({ method: 'put', invalidate: [['blajeni-tasks']] });
  const deleteTask = useAction({ method: 'delete', invalidate: [['blajeni-tasks']] });
  const saveNote = useAction({ url: '/blajeni/notes', invalidate: [['blajeni-notes']], successMessage: 'Note saved' });

  const [taskModal, setTaskModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', status: 'todo' });
  const [noteForm, setNoteForm] = useState({ content: '' });

  const allTasks = tasks.data ?? [];

  function move(task, dir) {
    const idx = COLUMNS.findIndex((c) => c.key === task.status);
    const next = COLUMNS[idx + dir];
    if (next) moveTask.mutate({ url: `/blajeni/tasks/${task.id}`, data: { status: next.key } });
  }

  return (
    <div className="j-screen-col">
      {/* toolbar */}
      <div className="j-row-head">
        <div className="j-sec-title">Blajeni Tasks</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="j-btn j-btn-ghost j-btn-sm" onClick={() => setNoteModal(true)}>
            <JIcon name="note" /> Note
          </button>
          <button className="j-btn j-btn-primary j-btn-sm" onClick={() => setTaskModal(true)}>
            <JIcon name="plus" /> Task
          </button>
        </div>
      </div>

      {/* kanban board */}
      {tasks.isLoading ? (
        <div className="j-skel" style={{ height: 300 }} />
      ) : (
        <div className="j-kanban">
          {COLUMNS.map((col, colIdx) => {
            const colTasks = allTasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="j-kanban-col">
                <div className="j-eyebrow" style={{ marginBottom: 10 }}>
                  {col.label} <span style={{ opacity: 0.5 }}>({colTasks.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colTasks.length === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--fg-muted)', textAlign: 'center', padding: '12px 0' }}>Empty</p>
                  )}
                  {colTasks.map((t) => (
                    <TiltCard key={t.id} className="j-task">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <div style={{ minWidth: 0 }}>
                          <div className={`j-task-title${t.status === 'done' ? ' done' : ''}`}>{t.title}</div>
                          {t.description && <div className="j-task-sub">{t.description}</div>}
                          <div style={{ marginTop: 6 }}>
                            <span className={priorityBadgeClass(t.priority)}>{t.priority}</span>
                          </div>
                        </div>
                        <button
                          className="j-btn j-btn-ghost j-btn-sm"
                          style={{ color: 'var(--red)', flexShrink: 0 }}
                          onClick={() => window.confirm('Delete task?') && deleteTask.mutate({ url: `/blajeni/tasks/${t.id}` })}
                        >
                          <JIcon name="trash" />
                        </button>
                      </div>
                      <div className="j-task-arrows">
                        <button
                          className="j-btn j-btn-ghost j-btn-sm"
                          disabled={colIdx === 0}
                          onClick={() => move(t, -1)}
                        >
                          <JIcon name="chevron-left" />
                        </button>
                        <button
                          className="j-btn j-btn-ghost j-btn-sm"
                          disabled={colIdx === COLUMNS.length - 1}
                          onClick={() => move(t, 1)}
                        >
                          <JIcon name="chevron-right" />
                        </button>
                      </div>
                    </TiltCard>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* notes section */}
      <div className="j-card">
        <div className="j-sec-title" style={{ marginBottom: 12 }}>Notes</div>
        {notes.isLoading ? (
          <div className="j-skel" style={{ height: 100 }} />
        ) : (notes.data ?? []).length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: '16px 0', fontSize: 14 }}>No notes yet.</p>
        ) : (
          <div className="j-memos">
            {notes.data.map((n) => (
              <div key={n.id} className="j-memo">
                {n.title && <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{n.title}</div>}
                <div style={{ fontSize: 13, color: 'var(--fg-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{n.content}</div>
                {n.created_at && (
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 6, opacity: 0.6 }}>{n.created_at?.slice(0, 10)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* add task modal */}
      {taskModal && (
        <div className="j-modal-veil" onClick={() => setTaskModal(false)}>
          <div className="j-modal" onClick={(e) => e.stopPropagation()}>
            <div className="j-modal-grab" />
            <div className="j-modal-head">New Task</div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await saveTask.mutateAsync({ data: taskForm });
                setTaskModal(false);
                setTaskForm({ title: '', priority: 'medium', status: 'todo' });
              }}
            >
              <div className="j-input-group">
                <label className="j-label">Title</label>
                <input
                  className="j-input"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="j-input-group">
                <label className="j-label">Priority</label>
                <select
                  className="j-input"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="j-input-group">
                <label className="j-label">Status</label>
                <select
                  className="j-input"
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                >
                  {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="button" className="j-btn j-btn-ghost" style={{ flex: 1 }} onClick={() => setTaskModal(false)}>Cancel</button>
                <button type="submit" className="j-btn j-btn-primary" style={{ flex: 1 }} disabled={saveTask.isPending}>
                  {saveTask.isPending ? 'Saving…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* add note modal */}
      {noteModal && (
        <div className="j-modal-veil" onClick={() => setNoteModal(false)}>
          <div className="j-modal" onClick={(e) => e.stopPropagation()}>
            <div className="j-modal-grab" />
            <div className="j-modal-head">New Note</div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await saveNote.mutateAsync({ data: noteForm });
                setNoteModal(false);
                setNoteForm({ content: '' });
              }}
            >
              <div className="j-input-group">
                <label className="j-label">Content</label>
                <textarea
                  className="j-input"
                  rows={5}
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="button" className="j-btn j-btn-ghost" style={{ flex: 1 }} onClick={() => setNoteModal(false)}>Cancel</button>
                <button type="submit" className="j-btn j-btn-primary" style={{ flex: 1 }} disabled={saveNote.isPending}>
                  {saveNote.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
