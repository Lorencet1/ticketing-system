"use client";

// The main page: the form on the left and the queue on the right.
// "use client" is up top because this page uses state and click handlers,
// which only work in the browser.

import { useEffect, useState } from "react";
import Link from "next/link";

// The choices in the priority dropdown.
const PRIORITIES = ["Low", "Medium", "High"];

// The filter buttons above the queue.
const FILTERS = ["All", "Open", "In progress", "Resolved"];

// Where a ticket goes next when its button gets clicked.
// Resolved isn't in here because that's the end of the line.
const NEXT_STATUS = {
  "Open": "In progress",
  "In progress": "Resolved",
};

// Badge colours for each status. These are just Tailwind class names.
const BADGE_COLORS = {
  "Open": "bg-amber-200 text-amber-900",
  "In progress": "bg-indigo-100 text-indigo-700",
  "Resolved": "bg-slate-200 text-slate-600",
};

// Asks my API for the tickets. I call this when the page opens
// and again after every change, so the screen always matches the database.
async function getTickets() {
  const response = await fetch("/api/tickets");
  return response.json();
}

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

export default function Home() {
  // All the tickets from the database. Starts empty until the server answers.
  const [tickets, setTickets] = useState([]);

  // Whatever is typed into the form right now.
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [error, setError] = useState("");

  // Which filter button is picked.
  const [filter, setFilter] = useState("All");

  // Whatever is typed into the search box.
  const [search, setSearch] = useState("");

  // Runs once when the page opens: load the saved tickets.
  // The empty [] at the end is what makes it run only once.
  useEffect(() => {
    getTickets().then(setTickets);
  }, []);

  async function createTicket(event) {
    // A form normally reloads the page when you submit it. I don't want that.
    event.preventDefault();

    // Don't bother the server with an empty ticket.
    if (title.trim() === "") {
      setError("Describe the issue first.");
      return;
    }

    // Send the ticket to the API. It saves it and gives it an id.
    await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, priority: priority }),
    });

    // Get the list again so the new ticket shows up, then reset the form.
    setTickets(await getTickets());
    setTitle("");
    setPriority("Medium");
    setError("");
  }

  async function moveTicket(ticket) {
    // Tell the API the next status. NEXT_STATUS up top decides what "next" is.
    await fetch("/api/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ticket.id, status: NEXT_STATUS[ticket.status] }),
    });

    setTickets(await getTickets());
  }

  async function deleteTicket(ticket) {
    // Double check first so one stray click doesn't delete a ticket.
    if (!confirm("Delete this ticket?")) {
      return;
    }

    await fetch("/api/tickets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ticket.id }),
    });

    setTickets(await getTickets());
  }

  // How many tickets still need work. I count instead of storing this in state,
  // because it can always be worked out from the ticket list.
  const openCount = tickets.filter((ticket) => ticket.status !== "Resolved").length;

  // What actually gets shown. Start with everything, then cut it down
  // by the filter button and the search box. This all happens in the browser,
  // no trip to the database, since the page already has every ticket.
  let shownTickets = tickets;

  if (filter !== "All") {
    shownTickets = shownTickets.filter((ticket) => ticket.status === filter);
  }

  if (search.trim() !== "") {
    // Lowercase both sides so typing "printer" still finds "Printer".
    shownTickets = shownTickets.filter((ticket) =>
      ticket.title.toLowerCase().includes(search.trim().toLowerCase())
    );
  }

  return (
    <main className="min-h-screen bg-indigo-50 px-5 py-12 font-sans text-slate-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight">Help desk</h1>
        <p className="mt-2 text-slate-600">Report an issue, then work it through the queue.</p>
        <Link href="/history" className="mt-2 inline-block text-sm text-indigo-700 hover:underline">View ticket history</Link>

        {/* Two columns on a wide screen, stacked on a phone */}
        <div className="mt-8 grid items-start gap-6 md:grid-cols-[1fr_1.4fr]">
          {/* Left side: the form. onSubmit means pressing Enter works too, not only the button. */}
          <form onSubmit={createTicket} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Report an issue</h2>

            {/* The input shows what's in state, and typing updates state. React calls this a controlled input. */}
            <label htmlFor="title" className="mt-4 block text-sm text-slate-600">What&apos;s wrong?</label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Can't log in to email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-600 focus:outline-none"
            />

            {/* The dropdown options come from the PRIORITIES list up top */}
            <label htmlFor="priority" className="mt-4 block text-sm text-slate-600">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-indigo-600 focus:outline-none"
            >
              {PRIORITIES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>

            {/* Only shows up when there's an error message to show */}
            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

            <button type="submit" className="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700">
              Create ticket
            </button>
          </form>

          {/* Right side: the queue */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Queue</h2>
              <span className="text-sm text-slate-600">{openCount} open</span>
            </div>

            {/* Search box. Typing here changes "search", and shownTickets above does the rest. */}
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tickets"
              aria-label="Search tickets"
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
            />

            {/* Filter buttons. The picked one gets the solid purple style. */}
            <div className="mt-3 flex flex-wrap gap-2">
              {FILTERS.map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    filter === option ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Nothing matches, so say so instead of leaving a blank space */}
            {shownTickets.length === 0 && <p className="mt-4 text-slate-600">No tickets to show here.</p>}

            {/* One row per ticket. React needs the key so it can tell the rows apart. */}
            <ul className="mt-4 flex flex-col gap-2">
              {shownTickets.map((ticket) => (
                <li key={ticket.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <span className="text-sm text-slate-500">#{ticket.id}</span>

                  {/* Resolved tickets get greyed out with a line through them */}
                  <div className="min-w-0 flex-1 basis-40">
                    <p className={ticket.status === "Resolved" ? "text-slate-400 line-through" : ""}>{ticket.title}</p>
                    <p className="text-xs text-slate-500">
                      {ticket.priority} priority, created {formatDate(ticket.created_at)}
                    </p>
                  </div>

                  {/* The badge colour is looked up from BADGE_COLORS by status */}
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${BADGE_COLORS[ticket.status]}`}>
                    {ticket.status}
                  </span>

                  {/* A resolved ticket has nowhere left to go, so no button for it */}
                  {ticket.status !== "Resolved" && (
                    <button
                      onClick={() => moveTicket(ticket)}
                      className="rounded-full border border-indigo-600 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-600 hover:text-white"
                    >
                      {ticket.status === "Open" ? "Start" : "Resolve"}
                    </button>
                  )}

                  <button
                    onClick={() => deleteTicket(ticket)}
                    className="text-xs text-slate-500 hover:text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}