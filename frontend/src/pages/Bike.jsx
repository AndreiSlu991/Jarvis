import { useRef, useState } from 'react';
import { Upload, Map, Mountain, Clock, Route } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../api/client';
import { useGet } from '../hooks/useApi';

const fmtDur = (s) => {
  if (s == null) return '—';
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

export default function Bike() {
  const activities = useGet('bike-activities', '/bike/activities');
  const [showKomoot, setShowKomoot] = useState(false);
  const komoot = useGet('komoot', '/bike/komoot', { enabled: showKomoot });
  const [detail, setDetail] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const qc = useQueryClient();

  async function uploadFit(file) {
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      await api.post('/bike/activities/upload', fd);
      toast.success('Activity imported');
      qc.invalidateQueries({ queryKey: ['bike-activities'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function openDetail(id) {
    try {
      const { data } = await api.get(`/bike/activities/${id}`);
      setDetail(data);
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button loading={uploading} onClick={() => fileRef.current.click()}>
          <Upload size={15} /> Upload FIT (Garmin / Coros)
        </Button>
        <Button variant="secondary" onClick={() => setShowKomoot(!showKomoot)}>
          <Map size={15} /> Komoot routes
        </Button>
        <input ref={fileRef} type="file" accept=".fit" hidden onChange={(e) => e.target.files[0] && uploadFit(e.target.files[0])} />
      </div>

      {showKomoot && (
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-gray-100">Komoot planned routes</h3>
          {komoot.isLoading ? (
            <div className="flex justify-center py-6"><LoadingSpinner /></div>
          ) : komoot.isError ? (
            <p className="text-sm text-red-400">{komoot.error.message}</p>
          ) : (komoot.data || []).length === 0 ? (
            <p className="text-sm text-gray-500">No planned routes found.</p>
          ) : (
            <ul className="divide-y divide-line">
              {komoot.data.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate text-gray-300">{t.name}</span>
                  <span className="ml-3 shrink-0 text-xs text-gray-500">
                    {t.distance?.toFixed(1)} km · ↑{Math.round(t.elevation_up || 0)} m
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {activities.isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (activities.data || []).length === 0 ? (
        <Card className="py-10 text-center text-sm text-gray-500">
          No rides yet. Upload a FIT file from your Garmin or Coros.
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.data.map((a) => (
            <Card key={a.id} className="cursor-pointer hover:border-gray-700" onClick={() => openDetail(a.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-100">{a.title}</h3>
                  <p className="text-xs text-gray-600">{a.date} · {a.source}</p>
                </div>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Route size={14} />{a.distance?.toFixed(1) ?? '—'} km</span>
                  <span className="hidden sm:flex items-center gap-1"><Clock size={14} />{fmtDur(a.duration)}</span>
                  <span className="hidden sm:flex items-center gap-1"><Mountain size={14} />{Math.round(a.elevation || 0)} m</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Date', detail.date],
              ['Distance', `${detail.distance?.toFixed(2) ?? '—'} km`],
              ['Duration', fmtDur(detail.duration)],
              ['Elevation', `${Math.round(detail.elevation || 0)} m`],
              ['Avg HR', detail.avg_hr ? `${Math.round(detail.avg_hr)} bpm` : '—'],
              ['Max HR', detail.max_hr ? `${Math.round(detail.max_hr)} bpm` : '—'],
              ['Source', detail.source],
              ['GPS points', detail.fit_data?.track?.length ?? 0]
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-surface-2 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">{k}</p>
                <p className="mt-0.5 text-gray-200">{v}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
