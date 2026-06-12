import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import TiltCard from '../components/ui/TiltCard.jsx';
import JIcon from '../components/ui/JIcon.jsx';
import api from '../api/client';
import { useGet } from '../hooks/useApi';

const fmtDur = (s) => {
  if (s == null) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

export default function Bike() {
  const activities = useGet(['bike-activities'], '/bike/activities?limit=10');
  const [showKomoot, setShowKomoot] = useState(false);
  const komoot = useGet(['bike-komoot'], '/bike/komoot', { enabled: showKomoot });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const qc = useQueryClient();

  async function uploadFit(file) {
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      await api.post('/bike/upload', fd);
      toast.success('Activity imported');
      qc.invalidateQueries({ queryKey: ['bike-activities'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
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
          e.dataTransfer.files[0] && uploadFit(e.dataTransfer.files[0]);
        }}
      >
        <JIcon name="upload" style={{ fontSize: 28, color: 'var(--fg-muted)' }} />
        <div className="j-dropzone-title">
          {uploading ? 'Importing activity…' : 'Drop a FIT file here or tap to upload'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>
          Garmin / Coros · .fit files
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".fit"
          hidden
          onChange={(e) => e.target.files[0] && uploadFit(e.target.files[0])}
        />
      </div>

      {/* komoot section */}
      <div className="j-card">
        <div className="j-row-head">
          <div className="j-sec-title">Komoot Routes</div>
          <button
            className="j-btn j-btn-ghost j-btn-sm"
            onClick={() => setShowKomoot((v) => !v)}
          >
            <JIcon name="map" /> {showKomoot ? 'Hide' : 'Show'}
          </button>
        </div>

        {showKomoot && (
          <div style={{ marginTop: 12 }}>
            {komoot.isLoading ? (
              <div className="j-skel" style={{ height: 100 }} />
            ) : komoot.isError ? (
              <p style={{ color: 'var(--red)', fontSize: 13 }}>{komoot.error?.message}</p>
            ) : (komoot.data ?? []).length === 0 ? (
              <p style={{ color: 'var(--fg-muted)', fontSize: 13 }}>No planned routes found.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {komoot.data.map((r) => (
                  <li
                    key={r.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{r.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--fg-muted)', flexShrink: 0, marginLeft: 12 }}>
                      {r.distance?.toFixed(1)} km · ↑{Math.round(r.elevation_up ?? 0)} m
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* activities list */}
      <div className="j-card" style={{ flex: 1 }}>
        <div className="j-sec-title" style={{ marginBottom: 12 }}>Activities</div>

        {activities.isLoading ? (
          <div className="j-skel" style={{ height: 240 }} />
        ) : (activities.data ?? []).length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: '32px 0', fontSize: 14 }}>
            No rides yet. Upload a FIT file.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activities.data.map((a) => (
              <TiltCard key={a.id} className="j-card" style={{ cursor: 'default' }}>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>
                    {a.date} · {a.source}
                  </div>
                </div>
                <div className="j-ride-stats">
                  <div className="j-metric">
                    <div className="j-metric-label">Distance</div>
                    <div className="j-metric-num">{a.distance?.toFixed(1) ?? '—'}</div>
                    <div className="j-metric-sub">km</div>
                  </div>
                  <div className="j-metric">
                    <div className="j-metric-label">Duration</div>
                    <div className="j-metric-num">{fmtDur(a.duration)}</div>
                    <div className="j-metric-sub">&nbsp;</div>
                  </div>
                  <div className="j-metric">
                    <div className="j-metric-label">Elevation</div>
                    <div className="j-metric-num">{Math.round(a.elevation ?? 0)}</div>
                    <div className="j-metric-sub">m</div>
                  </div>
                  {a.avg_hr != null && (
                    <div className="j-metric">
                      <div className="j-metric-label">Avg HR</div>
                      <div className="j-metric-num">{Math.round(a.avg_hr)}</div>
                      <div className="j-metric-sub">bpm</div>
                    </div>
                  )}
                </div>
              </TiltCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
