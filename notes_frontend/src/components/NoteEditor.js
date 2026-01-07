import React, { useEffect, useMemo, useState } from "react";
import "./NoteEditor.css";

// PUBLIC_INTERFACE
export default function NoteEditor({ initialNote, mode, onCancel, onSubmit, busy }) {
  /** Controlled form for creating/editing notes. */
  const initial = useMemo(() => {
    return {
      title: initialNote?.title || "",
      content: initialNote?.content || "",
    };
  }, [initialNote]);

  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setTitle(initial.title);
    setContent(initial.content);
    setTouched(false);
  }, [initial.title, initial.content]);

  const canSave = title.trim().length > 0 || content.trim().length > 0;
  const showHint = touched && !canSave;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!canSave) return;

    onSubmit({
      title: title.trim(),
      content: content,
    });
  };

  return (
    <form className="NoteEditor" onSubmit={handleSubmit}>
      <label className="Field">
        <span className="Label">Title</span>
        <input
          className="Input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Grocery list"
          onBlur={() => setTouched(true)}
          autoFocus
        />
      </label>

      <label className="Field">
        <span className="Label">Content</span>
        <textarea
          className="Textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note..."
          rows={10}
          onBlur={() => setTouched(true)}
        />
      </label>

      {showHint ? <div className="HintError">Add a title or some content to save.</div> : null}

      <div className="EditorActions">
        <button className="Btn BtnSubtle" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button className="Btn BtnPrimary" type="submit" disabled={busy || !canSave}>
          {busy ? "Saving…" : mode === "edit" ? "Save changes" : "Create note"}
        </button>
      </div>
    </form>
  );
}
