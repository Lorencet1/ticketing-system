// The database lives here. SQLite comes with Node, so I didn't have to install anything.
// Everything gets saved in one file called tickets.db in the project folder.

import { DatabaseSync } from "node:sqlite";

// Opens tickets.db, or makes it if this is the first run.
const db = new DatabaseSync("tickets.db");

// The main table. One row per ticket, showing what it looks like right now.
// "IF NOT EXISTS" means this only builds the table the first time.
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    priority   TEXT NOT NULL,
    status     TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

// The log. Every time something happens to a ticket, one row goes in here.
// I keep the title in this table too, so a deleted ticket still shows up by name.
db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id  INTEGER NOT NULL,
    title      TEXT NOT NULL,
    action     TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

// Shortcut for writing one line into the log, so I don't repeat this SQL
// every time a ticket gets created, moved or deleted.
export function addHistory(ticketId, title, action) {
  const now = new Date().toISOString();

  db.prepare(
    "INSERT INTO history (ticket_id, title, action, created_at) VALUES (?, ?, ?, ?)"
  ).run(ticketId, title, action, now);
}

export default db;