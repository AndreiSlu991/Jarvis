import { useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useGet, useAction } from '../hooks/useApi';

export default function Notes() {
  const projects = useGet('projects', '/notes/projects');
  const [activeProject, setActiveProject] = useState(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', tags: '' });

  const url = search
    ? `/notes/search?q=${encodeURIComponent(search)}`
    : activeProject ? `/notes?project_id=${activeProject}` : '/notes';
  const notes = useGet(['notes', activeProject, search], url);

  const save = useAction({ invalidate: [['notes']], successMessage: 'Note saved' });
  const remove = useAction({ method: 'delete', invalidate: [['notes']], successMessage: 'Note deleted' });

  const open = (note) => {
    setForm(note ? { title: note.title, content: note.content, tags: note.tags } : { title: '', content: '', tags: '' });
    setEditing(note || {});
  };

  const submit = async (e) => {
    e.preventDefault();
    await save.mutateAsync({
      url: editing?.id ? `/notes/${editing.id}` : '/notes',
      data: { ...form, project_id: editing?.id ? editing.project_id : activeProject }
    });
    setEditing(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setActiveProject(null)}
          className={`rounded-full px-3 py-1 text-xs ${!activeProject ? 'bg-accent text-white' : 'bg-white/[0.05] text-muted hover:bg-white/[0.08]'}`}>
          All
        </button>
        {(projects.data || []).map((p) => (
          <button key={p.id} onClick={() => setActiveProject(p.id)}
            className={`rounded-full px-3 py-1 text-xs ${activeProject === p.id ? 'text-white' : 'bg-white/[0.05] text-muted hover:bg-white/[0.08]'}`}
            style={activeProject === p.id ? { background: p.color } : {}}>
            {p.name}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
              className="w-36 rounded-lg border border-line bg-surface-2 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-accent sm:w-48" />
          </div>
          <Button onClick={() => open(null)} className="!px-3"><Plus size={16} /></Button>
        </div>
      </div>

      {notes.isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (notes.data || []).length === 0 ? (
        <Card className="py-10 text-center text-sm text-muted">No notes here yet.</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.data.map((n) => (
            <Card key={n.id} className="cursor-pointer hover:border-line-bright" onClick={() => open(n)}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-primary">{n.title}</h3>
                <button onClick={(e) => { e.stopPropagation(); confirm('Delete note?') && remove.mutate({ url: `/notes/${n.id}` }); }}
                  className="text-white/30 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted">{n.content}</p>
              <p className="mt-2 text-[11px] text-white/30">
                {formatDistanceToNow(new Date(n.updated_at + 'Z'), { addSuffix: true })}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit note' : 'New note'}>
        <form onSubmit={submit} className="space-y-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Content (markdown)" as="textarea" rows={10} value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <Button type="submit" loading={save.isPending} className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  );
}
