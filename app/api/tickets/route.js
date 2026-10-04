// This is the back end for tickets. The page never touches the database itself,
// it sends a request here and one of these four functions does the work.
// GET = read, POST = create, PATCH = update, DELETE = delete. That's CRUD.

import db, { addHistory } from "@/lib/db";

// Read: hand back every ticket.
// The CASE part turns High/Medium/Low into 1/2/3 so High sorts to the top.
// "id DESC" breaks ties, so the newest ticket comes first within the same priority.
export async function GET() {
  const tickets = db
    .prepare(
      `SELECT * FROM tickets
       ORDER BY
         CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
         id DESC`
    )
    .all();

  return Response.json(tickets);
}

// Create: save a new ticket.
export async function POST(request) {
  const { title, priority } = await request.json();

  // The page already checks for an empty title, but I check again here
  // because the server shouldn't trust whatever gets sent to it.
  if (!title || title.trim() === "") {
    return Response.json({ error: "Describe the issue first." }, { status: 400 });
  }

  const createdAt = new Date().toISOString();

  // Don't ever paste the user's text straight into the SQL string.
  // The ? marks let the database drop the values in safely (stops SQL injection).
  const result = db
    .prepare("INSERT INTO tickets (title, priority, status, created_at) VALUES (?, ?, 'Open', ?)")
    .run(title.trim(), priority, createdAt);

  // lastInsertRowid is the id the database just gave the new ticket.
  addHistory(result.lastInsertRowid, title.trim(), "Created");

  return Response.json({ ok: true }, { status: 201 });
}

// Update: change one ticket's status (Open -> In progress -> Resolved).
export async function PATCH(request) {
  const { id, status } = await request.json();

  // Grab the ticket first. I need its title for the log,
  // and if it isn't there I'd rather send a 404 than pretend it worked.
  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
  if (!ticket) {
    return Response.json({ error: "Ticket not found." }, { status: 404 });
  }

  db.prepare("UPDATE tickets SET status = ? WHERE id = ?").run(status, id);
  addHistory(id, ticket.title, "Moved to " + status);

  return Response.json({ ok: true });
}

// Delete: remove one ticket.
export async function DELETE(request) {
  const { id } = await request.json();

  // Same idea as above: look it up before deleting so the log can say which one it was.
  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
  if (!ticket) {
    return Response.json({ error: "Ticket not found." }, { status: 404 });
  }

  // The WHERE matters. Without it this would wipe the whole table.
  db.prepare("DELETE FROM tickets WHERE id = ?").run(id);
  addHistory(id, ticket.title, "Deleted");

  return Response.json({ ok: true });
}