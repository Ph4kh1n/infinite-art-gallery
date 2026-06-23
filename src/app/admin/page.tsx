'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ filename: string; status: string; error?: string }[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [existing, setExisting] = useState<{ filename: string; size: number }[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchExisting = useCallback(async () => {
    try {
      const res = await fetch(`/api/upload?token=${encodeURIComponent(password)}`);
      if (res.ok) {
        const data = await res.json();
        setExisting(data.images || []);
      }
    } catch {}
  }, [password]);

  useEffect(() => {
    if (authed) fetchExisting();
  }, [authed, fetchExisting]);

  const handleAuth = () => {
    if (password.trim()) setAuthed(true);
  };

  const addFiles = useCallback((list: FileList) => {
    setResults(null);
    const valid = Array.from(list).filter((f) => ALLOWED_TYPES.includes(f.type));
    setFiles((prev) => [...prev, ...valid]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setResults(null);

    const form = new FormData();
    form.set('token', password);
    files.forEach((f) => form.append('file', f));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      setResults(data.results || []);
      if (res.ok) {
        setFiles([]);
        fetchExisting();
      }
    } catch {
      setResults([{ filename: 'Upload failed', status: 'error', error: 'Network error' }]);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;
    setDeleting(filename);
    try {
      await fetch(`/api/upload?token=${encodeURIComponent(password)}&file=${encodeURIComponent(filename)}`, { method: 'DELETE' });
      setExisting((prev) => prev.filter((f) => f.filename !== filename));
    } catch {}
    setDeleting(null);
  };

  if (!authed) {
    return (
      <div className="fixed inset-0 bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="w-full max-w-sm mx-6">
          <h1 className="font-display text-display-sm text-foreground-light dark:text-foreground-dark text-center">Admin</h1>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            className="mt-6 w-full px-4 py-3 bg-transparent border border-border-light dark:border-border-dark font-mono text-sm text-foreground-light dark:text-foreground-dark outline-none focus:border-foreground-light dark:focus:border-foreground-dark transition-colors"
            autoFocus
          />
          <button
            onClick={handleAuth}
            className="mt-4 w-full py-3 font-mono text-xs uppercase tracking-wider text-foreground-light dark:text-foreground-dark border border-border-light dark:border-border-dark hover:bg-border-light dark:hover:bg-border-dark transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="font-display text-display-sm text-foreground-light dark:text-foreground-dark">Manage Images</h1>
        <p className="font-mono text-xs text-muted mt-2">JPG, PNG, GIF &middot; Max 20MB each</p>

        {existing.length > 0 && (
          <div className="mt-8">
            <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-3">Existing Images ({existing.length})</p>
            <div className="space-y-1">
              {existing.map((img) => (
                <div key={img.filename} className="flex items-center justify-between px-4 py-2.5 bg-border-light/20 dark:bg-border-dark/20 rounded-sm">
                  <span className="font-mono text-xs text-foreground-light dark:text-foreground-dark truncate mr-4">{img.filename}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[10px] text-muted">{(img.size / 1024 / 1024).toFixed(1)}MB</span>
                    <button
                      onClick={() => handleDelete(img.filename)}
                      disabled={deleting === img.filename}
                      className="font-mono text-[10px] uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      {deleting === img.filename ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className={`mt-8 border-2 border-dashed rounded-sm p-10 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-foreground-light dark:border-foreground-dark bg-border-light/30 dark:bg-border-dark/30'
              : 'border-border-light dark:border-border-dark hover:border-muted'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <p className="font-mono text-sm text-muted">Drop images here or click to browse</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif"
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-6 space-y-2 p-4 border border-border-light dark:border-border-dark rounded-sm">
            <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-2">New files</p>
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-mono text-xs text-foreground-light dark:text-foreground-dark truncate mr-4">{f.name}</span>
                <span className="font-mono text-[10px] text-muted shrink-0">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                <button onClick={() => removeFile(i)} className="ml-3 font-mono text-xs text-muted hover:text-foreground-light dark:hover:text-foreground-dark">&times;</button>
              </div>
            ))}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-3 w-full py-3 font-mono text-xs uppercase tracking-wider text-foreground-light dark:text-foreground-dark border border-border-light dark:border-border-dark hover:bg-border-light dark:hover:bg-border-dark transition-colors disabled:opacity-40"
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {results && (
          <div className="mt-6 space-y-1">
            {results.map((r) => (
              <p key={r.filename} className={`font-mono text-xs ${r.status === 'uploaded' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {r.filename} &mdash; {r.status}{r.error ? `: ${r.error}` : ''}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
