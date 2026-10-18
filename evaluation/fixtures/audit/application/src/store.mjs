// In-memory notes store. Validation lives here so every caller gets it.
const MAX_TITLE = 120;
const MAX_BODY = 10_000;

export function createStore() {
  const notes = new Map();
  let next = 1;
  return {
    create({ title, body = "" }) {
      if (typeof title !== "string" || title.trim() === "") throw new RangeError("title is required");
      if (title.length > MAX_TITLE) throw new RangeError(`title longer than ${MAX_TITLE}`);
      if (typeof body !== "string" || body.length > MAX_BODY) throw new RangeError(`body must be a string up to ${MAX_BODY}`);
      const note = { id: next++, title: title.trim(), body };
      notes.set(note.id, note);
      return note;
    },
    get: (id) => notes.get(id) ?? null,
    list: () => [...notes.values()],
    remove: (id) => notes.delete(id),
  };
}
