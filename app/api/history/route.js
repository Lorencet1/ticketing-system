// The back end for the History page. Only two things happen here:
// read the whole log, or wipe it.

import db from "@/lib/db";

// Read: every line in the log, newest first.
export async function GET() {
  const history = db.prepare("SELECT * FROM history ORDER BY id DESC").all();
  return Response.json(history);
}

// Wipe: no WHERE on purpose, this is meant to clear every row.
// It only touches the history table, the tickets are left alone.
export async function DELETE() {
  db.prepare("DELETE FROM history").run();
  return Response.json({ ok: true });
}