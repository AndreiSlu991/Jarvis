import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import TiltCard from '../components/ui/TiltCard.jsx';
import JIcon from '../components/ui/JIcon.jsx';
import api from '../api/client';
import { useGet, useAction } from '../hooks/useApi';

export default function Work() {
  const recordings = useGet(['recordings'], '/work/recordings?limit=20');
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [transcript, setTranscript] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const fileRef = useRef();
  const qc = useQueryClient();

  async function upload(file) {
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      await api.post('/work/upload', fd);
      toast.success('Transcribed and analyzed');
      qc.invalidateQueries({ queryKey: ['recordings'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteRecording(id) {
    setDeleting(id);
    try {
      await api.delete(`/work/recordings/${id}`);
      qc.invalidateQueries({ queryKey: ['recordings'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function toggleExpand(id) {
    if (expanded === id) return setExpanded(null);
    setExpanded(id);
    if (!transcript[id]) {
      try {
        const { data } = await api.get(`/work/recordings/${id}`);
        setTranscript((prev) => ({ ...prev, [id]: data.transcript }));
      } catch (err) {
        toast.error(err.message);
      }
    }
  }

  async function toggleAction(rec, actionId) {
    try {
      await api.post(`/work/recordings/${rec.id}/actions/${actionId}/toggle`);
      qc.invalidateQueries({ queryKey: ['recordings'] });
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="j-screen-col">
      {/* upload dropzone */}
      <div
        className={`j-dropzone${dragOver ? ' active' : ''}`}
        onClick={() => fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          e.dataTransfer.files[0] && upload(e.dataTransfer.files[0]);
        }}
      >
        <JIcon name="mic" style={{ fontSize: 28, color: 'var(--fg-muted)' }} />
        <div className="j-dropzone-title">
          {uploading
            ? 'Transcribing with Whisper, extracting action items with Claude…'
            : 'Drop a meeting recording here or tap to upload'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>
          mp3, wav, m4a, ogg — max 50 MB
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".mp3,.wav,.m4a,.ogg,.webm"
          hidden
          onChange={(e) => e.target.files[0] && upload(e.target.files[0])}
        />
      </div>

      {/* recordings list */}
      {recordings.isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => <div key={i} className="j-skel" style={{ height: 80 }} />)}
        </div>
      ) : (recordings.data ?? []).length === 0 ? (
        <div className="j-card" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-muted)', fontSize: 14 }}>
          No recordings yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recordings.data.map((rec) => {
            const actions = rec.action_items ?? [];
            const openCount = actions.filter((a) => !a.done).length;
            const isExpanded = expanded === rec.id;

            return (
              <TiltCard key={rec.id} className="j-card">
                {/* header */}
                <div className="j-row-head" style={{ marginBottom: actions.length ? 10 : 0 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{rec.title || 'Untitled recording'}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{rec.date}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span
                      className="j-badge"
                      style={{
                        background: openCount === 0 ? 'rgba(34,197,94,.15)' : 'rgba(234,179,8,.15)',
                        color: openCount === 0 ? 'var(--green)' : '#facc15',
                      }}
                    >
                      {openCount === 0 ? 'Done' : `${openCount} open`}
                    </span>
                    <button
                      className="j-btn j-btn-ghost j-btn-sm"
                      style={{ color: 'var(--red)', opacity: deleting === rec.id ? 0.5 : 1 }}
                      onClick={() => deleteRecording(rec.id)}
                      disabled={deleting === rec.id}
                    >
                      <JIcon name="trash" />
                    </button>
                  </div>
                </div>

                {/* action items */}
                {actions.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {actions.map((a, i) => (
                      <li key={a.id ?? i}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={!!a.done}
                            onChange={() => toggleAction(rec, a.id ?? i)}
                            style={{ marginTop: 2, flexShrink: 0 }}
                          />
                          <span style={{
                            color: a.done ? 'var(--fg-muted)' : 'inherit',
                            textDecoration: a.done ? 'line-through' : 'none',
                          }}>
                            {a.text}
                            {a.owner && (
                              <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--fg-muted)' }}>({a.owner})</span>
                            )}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}

                {/* transcript toggle */}
                <button
                  className="j-btn j-btn-ghost j-btn-sm"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => toggleExpand(rec.id)}
                >
                  <JIcon name={isExpanded ? 'chevron-up' : 'chevron-down'} /> Transcript
                </button>
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 8,
                      maxHeight: 240,
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      background: 'var(--surface-raised)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: 'var(--fg-muted)',
                    }}
                  >
                    {transcript[rec.id] ?? 'Loading…'}
                  </div>
                )}
              </TiltCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
