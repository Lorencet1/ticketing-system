"use client";

// The History page. Because this file is at app/history/page.js,
// Next.js serves it at /history. The folder name is the URL.

import { useEffect, useState } from "react";
import Link from "next/link";

// Dates are saved like "2026-10-03T20:15:00.000Z", which nobody wants to read.
// This turns that into something like "Oct 3, 2:15 p.m."
function formatDate(savedDate) {
  return new Date(savedDate).toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  // The log lines I'm showing. Starts empty until the server answers.
  const [history, setHistory] = useState([]);

  // Runs once when the page opens: go get the log from the API.
  // The empty [] at the end is what makes it run only once.
  useEffect(() => {
    fetch("/api/history")
      .then((response) => response.json())
      .then(setHistory);
  }, []);

  async function clearHistory() {
    // Double check before wiping, there's no undo.
    if (!confirm("Delete all history? This can't be undone.")) {
      return;
    }

    // Tell the server to wipe the table, then empty my own list
    // so the screen matches what's in the database.
    await fetch("/api/history", { method: "DELETE" });
    setHistory([]);
  }

  return (
    <main className="min-h-screen bg-indigo-50 px-5 py-12 font-sans text-slate-900">
      <div className="mx-auto max-w-2xl">
        {/* Link instead of a normal <a> so going back doesn't reload the whole page */}
        <Link href="/" className="text-sm text-indigo-700 hover:underline">Back to the queue</Link>

        <h1 className="mt-3 text-4xl font-bold tracking-tight">Ticket history</h1>
        <p className="mt-2 text-slate-600">Everything that has happened to every ticket, newest first.</p>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          {/* Nothing in the log yet, so say so instead of showing a blank box */}
          {history.length === 0 && <p className="text-slate-600">Nothing has happened yet.</p>}

          {/* No point showing a clear button when there's nothing to clear */}
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="mb-4 rounded-lg border border-red-700 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-700 hover:text-white"
            >
              Clear history
            </button>
          )}

          {/* One box per log line. React needs the key so it can tell the lines apart. */}
          <ul className="flex flex-col gap-2">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="font-medium">{entry.action}</p>
                <p className="text-sm text-slate-700">
                  #{entry.ticket_id} {entry.title}
                </p>
                <p className="text-xs text-slate-500">{formatDate(entry.created_at)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}