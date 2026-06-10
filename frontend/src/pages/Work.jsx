import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import TiltCard from '../components/ui/TiltCard.jsx';
import JIcon from '../components/ui/JIcon.jsx';
import api from '../api/client';
import { useGet } from '../hooks/useApi';

export default function Work() {
  const { data: recordings, isLoading } = useGet('recordings', '/api/work/recordings?limit=20');
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [transcripts, setTranscripts] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const qc = useQueryClient();

  async function upload(file) {
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      await api.post('/api/work/upload', fd);
      toast.success('Transcribed and analyzed');
      qc.invalidateQueries({ queryKey: ['recordings'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function toggleExpand(id) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!transcripts[id]) {
      try {
        const { data } = await api.get(`/api/work/recordings/${id}`);
        setTranscripts(t => ({ ...t, [id]: data.transcript }));
      } catch {}
    }
  }

  async function toggleAction(rec, actionId) {
    try {
      await api.post(`/api/work/recordings/${rec.id}/actions/${actionId}/toggle`);
      qc.invalidateQueries({ queryKey: ['recordings'] });
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="j-screen j-screen-col">
      {/* Upload zone */}
      <div
        className={`j-dropzone${dragOver ? ' over' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && upload(e.dataTransfer.files[0]); }}
      >
        <JIcon name="mic" size={28} style={{ color: 'var(--accent)' }} />
        {uploading ? (
          <>
            <div className="j-dropzone-title">Transcribing…</div>
            <p>Processing with Whisper + Claude</p>
          </>
        ) : (
          <>
            <div className="j-dropzone-title">Drop a recording here</div>
            <p>mp3, wav, m4a, ogg, webm — max 50 MB</p>
          </>
        )}
        <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a,.ogg,.webm" hidden
          onChange={e => e.target.files[0] && upload(e.target.files[0])} />
      </div>

      {/* Recordings */}
      <div className="j-memos" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading && [1,2,3].map(i => <div key={i} className="j-skel" style={{ height: 80 }} />)}
        {!isLoading && !recordings?.length && (
          <p style={{ textAlign: 'center', color: 'var(--faint)', padding: '2rem 0', fontSize: 14 }}>No recordings yet.</p>
        )}
        {(recordings || []).map(rec => {
          const openCount = (rec.action_items || []).filter(a => !a.done).length;
          const isOpen = expanded === rec.id;
          return (
            <TiltCard key={rec.id} className="j-card j-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 15 }}>{rec.title || 'Untitled recording'}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)' }}>{rec.date}</div>
                </div>
                <span className={`j-badge${openCount === 0 ? '' : ' medium'}`}>
                  {openCount === 0 ? 'done' : `${openCount} open`}
                </span>
              </div>

              {(rec.action_items || []).length > 0 && (
                <div className="j-checklist">
                  {rec.action_items.map((a, i) => (
                    <button key={i} className={`j-checkitem${a.done ? ' done' : ''}`}
                      onClick={() => toggleAction(rec, a.id ?? i)}>
                      <span className="j-checkbox">
                        {a.done && <JIcon name="check" size={11} />}
                      </span>
                      <span>{a.text}</span>
                      {a.owner && <em>{a.owner}</em>}
                    </button>
                  ))}
                </div>
              )}

              <button className="j-ghost-btn" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--faint)', width: 'auto' }}
                onClick={() => toggleExpand(rec.id)}>
                <JIcon name={isOpen ? 'chevron' : 'chevron'} size={13} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(270deg)' }} />
                Transcript
              </button>
              {isOpen && (
                <pre style={{ marginTop: 8, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)', fontSize: 12, color: 'var(--dim)', whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto', lineHeight: 1.6 }}>
                  {transcripts[rec.id] ?? 'Loading…'}
                </pre>
              )}
            </TiltCard>
          );
        })}
      </div>
    </div>
  );
}
