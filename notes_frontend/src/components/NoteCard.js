import React from "react";
import "./NoteCard.css";

// PUBLIC_INTERFACE
export default function NoteCard({ note, onEdit, onDelete }) {
  /** Render a note card with title/content preview and actions. */
  const title = note?.title || "Untitled";
  const content = note?.content || "";
  const preview = content.length > 220 ? `${content.slice(0, 220)}…` : content;

  return (
    <article className="NoteCard">
      <div className="NoteCardTop">
        <h3 className="NoteTitle" title={title}>
          {title}
        </h3>

        <div className="NoteActions">
          <button className="Btn BtnSubtle" type="button" onClick={() => onEdit(note)}>
            Edit
          </button>
          <button className="Btn BtnDangerSubtle" type="button" onClick={() => onDelete(note)}>
            Delete
          </button>
        </div>
      </div>

      <p className="NoteContent">{preview || <span className="Muted">No content</span>}</p>
    </article>
  );
}
