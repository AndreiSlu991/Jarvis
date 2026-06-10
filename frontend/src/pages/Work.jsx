import { useRef, useState } from 'react';
import { Mic, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../api/client';
import { useGet, useAction } from '../hooks/useApi';

export default function Work() {
  const recordings = useGet('recordings', '/work/recordings');
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [transcript, setTranscript] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const qc = useQueryClient();

  const updateActions = useAction({ method: 'put', invalidate: ['recordings'] });

  async function upload(file) {
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      await api.post('/work/recordings/upload', fd);
      toast.success('Transcribed and analyzed');
      qc.invalidateQueries({ queryKey: ['recordings'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function toggleExpand(id) {
    if (expanded === id) return setExpanded(null);
    setExpanded(id);
    if (!transcript[id]) {
      try {
        const { data } = await api.get(`/work/recordings/${id}`);
        setTranscript((t) => ({ ...t, [id]: data.transcript }));
      } catch (err) {
        toast.error(err.message);
      }
    }
  }

  function toggleAction(rec, idx) {
    const items = rec.action_items.map((a, i) => (i === idx ? { ...a, done: !a.done } : a));
    updateActions.mutate({ url: `/work/recordings/${rec.id}/actions`, data: { action_items: items } });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div
        onClick={() => fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && upload(e.dataTransfer.files[0]); }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-150 ${
          dragOver ? 'border-accent bg-accent/5' : 'border-line hover:border-white/20'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3 text-sm text-muted">
            <LoadingSpinner size="lg" />
            Transcribing with Whisper, extracting action items with Claude…
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted">
            <Mic size={28} />
            <p className="text-sm">Drop a meeting recording here or tap to upload</p>
            <p className="text-xs text-white/30">mp3, wav, m4a, ogg — max 50 MB</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a,.ogg,.webm" hidden
          onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
      </div>

      {recordings.isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (recordings.data || []).length === 0 ? (
        <Card className="py-8 text-center text-sm text-muted">No recordings yet.</Card>
      ) : (
        recordings.data.map((rec) => {
          const open = (rec.action_items || []).filter((a) => !a.done).length;
          return (
            <Card key={rec.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-primary">{rec.title}</h3>
                  <p className="text-xs text-white/30">{rec.date}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${
                  open === 0 ? 'bg-green-500/15 text-green-300' : 'bg-yellow-500/15 text-yellow-300'
                }`}>
                  {open === 0 ? 'Done' : `${open} open`}
                </span>
              </div>

              {(rec.action_items || []).length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {rec.action_items.map((a, i) => (
                    <li key={i}>
                      <label className="flex cursor-pointer items-start gap-2 text-sm">
                        <input type="checkbox" checked={!!a.done} onChange={() => toggleAction(rec, i)}
                          className="mt-0.5 h-4 w-4 rounded accent-violet-600" />
                        <span className={a.done ? 'text-white/30 line-through' : 'text-white/75'}>
                          {a.text}
                          {a.owner && <span className="ml-1 text-xs text-muted">({a.owner})</span>}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              <button onClick={() => toggleExpand(rec.id)}
                className="mt-3 flex items-center gap-1 text-xs text-muted hover:text-white/75">
                {expanded === rec.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Transcript
              </button>
              {expanded === rec.id && (
                <p className="mt-2 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white/[0.04] p-3 text-xs leading-relaxed text-muted">
                  {transcript[rec.id] ?? 'Loading…'}
                </p>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
