'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_MB = 4;

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
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

  const handleAuth = async () => {
    if (!password.trim()) return;
    setAuthError('');
    try {
      const res = await fetch(`/api/upload?token=${encodeURIComponent(password)}`);
      if (res.ok) {
        setAuthed(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.error || 'Invalid password');
      }
    } catch {
      setAuthError('Could not connect to server');
    }
  };

  const addFiles = useCallback((list: FileList) => {
    setResults(null);
    const valid = Array.from(list).filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) return false;
      if (f.size > MAX_MB * 1024 * 1024) return false;
      return true;
    });
    const skipped = Array.from(list).length - valid.length;
    const msgs: { filename: string; status: string; error?: string }[] = [];
    if (skipped > 0) {
      msgs.push({ filename: `${skipped} file(s) skipped`, status: 'error', error: `Max ${MAX_MB}MB, JPG/PNG/GIF only` });
    }
    if (msgs.length > 0) setResults(msgs);
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
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { results: [{ filename: 'Server error', status: 'error', error: `HTTP ${res.status}: ${text.slice(0, 300)}` }] };
      }
      setResults(data.results || []);
      if (res.ok) {
        setFiles([]);
        fetchExisting();
      }
    } catch (err) {
      setResults([{ filename: 'Request failed', status: 'error', error: String(err) }]);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;
    setDeleting(filename);
    try {
      const res = await fetch(`/api/upload?token=${encodeURIComponent(password)}&file=${encodeURIComponent(filename)}`, { method: 'DELETE' });
      if (res.ok) setExisting((prev) => prev.filter((f) => f.filename !== filename));
    } catch {}
    setDeleting(null);
  };

  const s = (base: string) => base; // dummy for cursor styles

  if (!authed) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ cursor: 'auto' }}>
        <div className="w-full max-w-sm mx-6">
          <h1 className="font-display text-display-sm text-foreground-light dark:text-foreground-dark text-center" style={{ cursor: 'auto' }}>Admin</h1>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            className="mt-6 w-full px-4 py-3 bg-transparent border border-border-light dark:border-border-dark font-mono text-sm text-foreground-light dark:text-foreground-dark outline-none focus:border-foreground-light dark:focus:border-foreground-dark transition-colors"
            style={{ cursor: 'auto' }}
            autoFocus
          />
          {authError && (
            <p className="mt-3 font-mono text-xs text-red-500" style={{ cursor: 'auto' }}>{authError}</p>
          )}
          <button
            onClick={handleAuth}
            className="mt-4 w-full py-3 font-mono text-xs uppercase tracking-wider text-foreground-light dark:text-foreground-dark border border-border-light dark:border-border-dark hover:bg-border-light dark:hover:bg-border-dark transition-colors"
            style={{ cursor: 'pointer' }}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark" style={{ cursor: 'auto' }}>
      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="font-display text-display-sm text-foreground-light dark:text-foreground-dark" style={{ cursor: 'auto' }}>Manage Images</h1>
        <p className="font-mono text-xs text-muted mt-2" style={{ cursor: 'auto' }}>JPG, PNG, GIF &middot; Max {MAX_MB}MB each</p>

        {existing.length > 0 && (
          <div className="mt-8">
            <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-3" style={{ cursor: 'auto' }}>Existing Images ({existing.length})</p>
            <div className="space-y-1">
              {existing.map((img) => (
                <div key={img.filename} className="flex items-center justify-between px-4 py-2.5 bg-border-light/20 dark:bg-border-dark/20 rounded-sm">
                  <span className="font-mono text-xs text-foreground-light dark:text-foreground-dark truncate mr-4" style={{ cursor: 'auto' }}>{img.filename}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[10px] text-muted" style={{ cursor: 'auto' }}>{(img.size / 1024 / 1024).toFixed(1)}MB</span>
                    <button
                      onClick={() => handleDelete(img.filename)}
                      disabled={deleting === img.filename}
                      className="font-mono text-[10px] uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors disabled:opacity-40"
                      style={{ cursor: 'pointer' }}
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
          className={`mt-8 border-2 border-dashed rounded-sm p-10 text-center transition-colors ${
            dragOver
              ? 'border-foreground-light dark:border-foreground-dark bg-border-light/30 dark:bg-border-dark/30'
              : 'border-border-light dark:border-border-dark hover:border-muted'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          <p className="font-mono text-sm text-muted" style={{ cursor: 'inherit' }}>Drop images here or click to browse</p>
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
            <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-2" style={{ cursor: 'auto' }}>New files</p>
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-mono text-xs text-foreground-light dark:text-foreground-dark truncate mr-4" style={{ cursor: 'auto' }}>{f.name}</span>
                <span className="font-mono text-[10px] text-muted shrink-0" style={{ cursor: 'auto' }}>{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                <button onClick={() => removeFile(i)} className="ml-3 font-mono text-xs text-muted hover:text-foreground-light dark:hover:text-foreground-dark" style={{ cursor: 'pointer' }}>&times;</button>
              </div>
            ))}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-3 w-full py-3 font-mono text-xs uppercase tracking-wider text-foreground-light dark:text-foreground-dark border border-border-light dark:border-border-dark hover:bg-border-light dark:hover:bg-border-dark transition-colors disabled:opacity-40"
              style={{ cursor: uploading ? 'default' : 'pointer' }}
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {results && (
          <div className="mt-6 space-y-1">
            {results.map((r, i) => (
              <p key={i} className={`font-mono text-xs ${r.status === 'uploaded' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`} style={{ cursor: 'auto' }}>
                {r.filename} &mdash; {r.status}{r.error ? `: ${r.error}` : ''}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
