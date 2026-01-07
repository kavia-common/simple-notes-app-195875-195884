const DEFAULT_TIMEOUT_MS = 15000;

function getApiBase() {
  const fromEnv =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    "";
  return (fromEnv || "").replace(/\/+$/, "");
}

function joinUrl(base, path) {
  const b = (base || "").replace(/\/+$/, "");
  const p = (path || "").replace(/^\/+/, "");
  if (!b) return `/${p}`;
  return `${b}/${p}`;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const resp = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const contentType = resp.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await resp.json().catch(() => null) : await resp.text();

    if (!resp.ok) {
      const message =
        (payload && typeof payload === "object" && (payload.detail || payload.message)) ||
        (typeof payload === "string" && payload) ||
        `Request failed (${resp.status})`;
      const err = new Error(message);
      err.status = resp.status;
      err.payload = payload;
      throw err;
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** Fetch all notes. Returns an array. */
  const base = getApiBase();
  const candidates = [
    joinUrl(base, "/notes"),
    joinUrl(base, "/api/notes"),
  ];

  // Try common paths without hard failing on the first 404 (backend shape may vary).
  for (let i = 0; i < candidates.length; i += 1) {
    try {
      const data = await fetchJson(candidates[i], { method: "GET" });
      // Allow either {notes:[...]} or direct array
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.notes)) return data.notes;
      return data;
    } catch (e) {
      if (e && e.status === 404 && i < candidates.length - 1) continue;
      throw e;
    }
  }

  return [];
}

// PUBLIC_INTERFACE
export async function createNote(note) {
  /** Create a note. Expects {title, content}. Returns created note. */
  const base = getApiBase();
  const candidates = [
    joinUrl(base, "/notes"),
    joinUrl(base, "/api/notes"),
  ];

  for (let i = 0; i < candidates.length; i += 1) {
    try {
      return await fetchJson(candidates[i], {
        method: "POST",
        body: JSON.stringify(note),
      });
    } catch (e) {
      if (e && e.status === 404 && i < candidates.length - 1) continue;
      throw e;
    }
  }

  throw new Error("Unable to create note: endpoint not found");
}

// PUBLIC_INTERFACE
export async function updateNote(noteId, note) {
  /** Update a note by id. Returns updated note. */
  const base = getApiBase();
  const candidates = [
    joinUrl(base, `/notes/${encodeURIComponent(noteId)}`),
    joinUrl(base, `/api/notes/${encodeURIComponent(noteId)}`),
  ];

  for (let i = 0; i < candidates.length; i += 1) {
    try {
      return await fetchJson(candidates[i], {
        method: "PUT",
        body: JSON.stringify(note),
      });
    } catch (e) {
      if (e && e.status === 404 && i < candidates.length - 1) continue;
      throw e;
    }
  }

  throw new Error("Unable to update note: endpoint not found");
}

// PUBLIC_INTERFACE
export async function deleteNote(noteId) {
  /** Delete a note by id. */
  const base = getApiBase();
  const candidates = [
    joinUrl(base, `/notes/${encodeURIComponent(noteId)}`),
    joinUrl(base, `/api/notes/${encodeURIComponent(noteId)}`),
  ];

  for (let i = 0; i < candidates.length; i += 1) {
    try {
      await fetchJson(candidates[i], { method: "DELETE" });
      return;
    } catch (e) {
      if (e && e.status === 404 && i < candidates.length - 1) continue;
      throw e;
    }
  }

  throw new Error("Unable to delete note: endpoint not found");
}
