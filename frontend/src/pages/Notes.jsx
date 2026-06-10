import { useState } from 'react';
import { useGet, useAction } from '../hooks/useApi';
import JIcon from '../components/ui/JIcon.jsx';

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return diffDays + 'd ago';
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export default function Notes() {
  const projects = useGet('projects', '/api/notes/projects');
  const [activeProject, setActiveProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  const notesUrl = activeProject ? `/api/notes?project_id=${activeProject}` : '/api/notes';
  const notes = useGet(['notes', activeProject], notesUrl);

  const addNote = useAction({
    method: 'post',
    url: '/api/notes',
    invalidate: [['notes', activeProject], ['notes', null]],
  });

  const deleteNote = useAction({
    method: 'delete',
    url: '/api/notes/__placeholder__',
    invalidate: [['notes', activeProject], ['notes', null]],
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    await addNote.mutateAsync({
      title: form.title,
      content: form.content,
      project_id: activeProject || undefined,
    });
    setForm({ title: '', content: '' });
    setShowModal(false);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note?')) return;
    deleteNote.mutate({ _url: `/api/notes/${id}` });
  };

  const projectColor = (pid) => {
    const p = (projects.data || []).find((x) => x.id === pid);
    return p?.color || '#888';
  };

  return (
    <div className="j-screen-col">
      {/* Project tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, alignItems: 'center' }}>
        <button
          className="j-tag"
          style={!activeProject ? { background: 'var(--accent)', color: '#fff', border: 'none' } : {}}
          onClick={() => setActiveProject(null)}
        >
          All
        </button>
        {(projects.data || []).map((p) => (
          <button
            key={p.id}
            className="j-tag"
            style={activeProject === p.id ? { background: p.color, color: '#fff', border: 'none' } : {}}
            onClick={() => setActiveProject(p.id)}
          >
            {p.name}
          </button>
        ))}
        <button
          className="j-btn j-btn-primary j-btn-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => setShowModal(true)}
        >
          <JIcon name="plus" /> New note
        </button>
      </div>

      {/* Notes grid */}
      {notes.isLoading ? (
        <div className="j-notes-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="j-skel" style={{ height: 140, borderRadius: 12 }} />
          ))}
        </div>
      ) : (notes.data || []).length === 0 ? (
        <div className="j-card" style={{ textAlign: 'center', padding: '2.5rem 1rem', opacity: 0.6 }}>
          No notes here yet. Hit "New note" to start.
        </div>
      ) : (
        <div className="j-notes-grid">
          {(notes.data || []).map((n) => (
            <div key={n.id} className="j-note">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <span className="j-habit-name" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.title}
                </span>
                <button
                  className="j-ghost-btn"
                  style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                  onClick={(e) => handleDelete(e, n.id)}
                  title="Delete"
                >
                  <JIcon name="trash" />
                </button>
              </div>
              <p style={{
                marginTop: 6,
                fontSize: 13,
                color: 'var(--text-muted)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}>
                {n.content}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <span className="j-note-date">{fmtDate(n.updated_at)}</span>
                {n.project_id && (
                  <span
                    className="j-tag"
                    style={{ background: projectColor(n.project_id) + '33', color: projectColor(n.project_id), border: 'none', fontSize: 11 }}
                  >
                    {(projects.data || []).find((p) => p.id === n.project_id)?.name || ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add note modal */}
      {showModal && (
        <>
          <div className="j-modal-veil" onClick={() => setShowModal(false)} />
          <div className="j-modal">
            <div className="j-modal-grab" />
            <div className="j-modal-head">
              <span>New note</span>
              <button className="j-ghost-btn" onClick={() => setShowModal(false)}><JIcon name="x" /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 1rem 1.25rem' }}>
              <div className="j-input-group">
                <label className="j-label">Title</label>
                <input
                  className="j-input"
                  placeholder="Note title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="j-input-group">
                <label className="j-label">Content</label>
                <textarea
                  className="j-input"
                  placeholder="Write something…"
                  rows={7}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>
              {(projects.data || []).length > 0 && (
                <div className="j-input-group">
                  <label className="j-label">Project</label>
                  <select
                    className="j-input"
                    value={activeProject || ''}
                    onChange={(e) => setActiveProject(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">None</option>
                    {(projects.data || []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" className="j-btn j-btn-primary" disabled={addNote.isPending}>
                {addNote.isPending ? 'Saving…' : 'Save note'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
