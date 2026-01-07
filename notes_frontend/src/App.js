import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Modal from "./components/Modal";
import NoteCard from "./components/NoteCard";
import NoteEditor from "./components/NoteEditor";
import { createNote, deleteNote, listNotes, updateNote } from "./api/notesApi";

function getNoteId(note) {
  return note?.id ?? note?._id ?? note?.note_id ?? note?.uuid ?? note?.pk;
}

function normalizeNotes(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw.notes && Array.isArray(raw.notes)) return raw.notes;
  return [];
}

// PUBLIC_INTERFACE
export default function App() {
  /** Notes app: list/create/edit/delete with a modal editor. */
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create"); // "create" | "edit"
  const [activeNote, setActiveNote] = useState(null);
  const [saving, setSaving] = useState(false);

  const apiBase = useMemo(() => {
    return process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "";
  }, []);

  const load = async (isRefresh = false) => {
    try {
      setError("");
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await listNotes();
      setNotes(normalizeNotes(data));
    } catch (e) {
      setError(e?.message || "Failed to load notes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditorMode("create");
    setActiveNote(null);
    setEditorOpen(true);
  };

  const openEdit = (note) => {
    setEditorMode("edit");
    setActiveNote(note);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
  };

  const handleSave = async (payload) => {
    try {
      setSaving(true);
      setError("");

      if (editorMode === "edit") {
        const id = getNoteId(activeNote);
        if (!id) throw new Error("This note is missing an id; cannot update.");
        const updated = await updateNote(id, payload);

        setNotes((prev) => {
          const uid = id;
          return prev.map((n) => (String(getNoteId(n)) === String(uid) ? (updated || { ...n, ...payload }) : n));
        });
      } else {
        const created = await createNote(payload);
        setNotes((prev) => {
          // If backend doesn't return created note, fall back to optimistic note
          const toAdd = created && typeof created === "object" ? created : { ...payload, id: crypto?.randomUUID?.() };
          return [toAdd, ...prev];
        });
      }

      setEditorOpen(false);
    } catch (e) {
      setError(e?.message || "Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (note) => {
    const id = getNoteId(note);
    if (!id) {
      setError("This note is missing an id; cannot delete.");
      return;
    }

    const confirmed = window.confirm("Delete this note? This can't be undone.");
    if (!confirmed) return;

    try {
      setError("");
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => String(getNoteId(n)) !== String(id)));
    } catch (e) {
      setError(e?.message || "Failed to delete note.");
    }
  };

  return (
    <div className="AppShell">
      <header className="TopBar">
        <div className="TopBarInner">
          <div className="Brand">
            <div className="BrandMark" aria-hidden="true" />
            <div className="BrandText">
              <div className="BrandTitle">Notes</div>
              <div className="BrandSubtitle">Create, edit, and organize your thoughts</div>
            </div>
          </div>

          <div className="TopBarActions">
            <button className="Btn BtnSubtle" type="button" onClick={() => load(true)} disabled={loading || refreshing}>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <button className="Btn BtnPrimary" type="button" onClick={openCreate}>
              + Add note
            </button>
          </div>
        </div>
      </header>

      <main className="Main">
        <section className="Panel" aria-label="Notes list">
          <div className="PanelHeader">
            <div className="PanelHeaderLeft">
              <h1 className="PanelTitle">Your notes</h1>
              <div className="PanelMeta">
                {loading ? "Loading…" : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
              </div>
            </div>

            <div className="PanelHeaderRight">
              {apiBase ? (
                <div className="ApiBadge" title={`API base: ${apiBase}`}>
                  API: {apiBase}
                </div>
              ) : (
                <div className="ApiBadge ApiBadgeWarn" title="No API base configured; using relative /notes paths.">
                  API: (relative)
                </div>
              )}
            </div>
          </div>

          {error ? (
            <div className="Alert AlertError" role="alert">
              <div className="AlertTitle">Something went wrong</div>
              <div className="AlertBody">{error}</div>
            </div>
          ) : null}

          {loading ? (
            <div className="EmptyState">
              <div className="Spinner" aria-hidden="true" />
              <div className="EmptyTitle">Loading notes</div>
              <div className="EmptySubtitle">Fetching your latest notes from the server…</div>
            </div>
          ) : notes.length === 0 ? (
            <div className="EmptyState">
              <div className="EmptyIcon" aria-hidden="true">
                ✎
              </div>
              <div className="EmptyTitle">No notes yet</div>
              <div className="EmptySubtitle">Create your first note to get started.</div>
              <button className="Btn BtnPrimary" type="button" onClick={openCreate}>
                + Add note
              </button>
            </div>
          ) : (
            <div className="NotesGrid">
              {notes.map((n, idx) => {
                const id = getNoteId(n);
                const key = id ? String(id) : `idx-${idx}`;
                return <NoteCard key={key} note={n} onEdit={openEdit} onDelete={handleDelete} />;
              })}
            </div>
          )}
        </section>
      </main>

      <Modal
        open={editorOpen}
        title={editorMode === "edit" ? "Edit note" : "Create note"}
        onClose={closeEditor}
        labelledById="note-editor-title"
        footer={null}
      >
        <NoteEditor
          initialNote={activeNote}
          mode={editorMode}
          busy={saving}
          onCancel={closeEditor}
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  );
}
