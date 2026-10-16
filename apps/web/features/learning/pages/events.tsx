"use client";

import Link from "next/link";
import {
  CalendarDays,
  Check,
  Plus,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Badge } from "@/components/ui";
import {
  getLearningContentErrorMessage,
  getLearningEvents,
  type LearningEvent,
} from "@/lib/learning/learningContentApi";

function EventState({
  title,
  body,
  onRetry,
}: {
  title: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="groups-tab-state card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
      <div className="empty-icon"><CalendarDays size={30} /></div>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
      {onRetry ? (
        <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EventsContent() {
  const [tab, setTab] = useState("Discover");
  const [joined, setJoined] = useState<string[]>([]);
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = async () => {
    setIsLoading(true);
    setError("");
    try {
      setEvents(await getLearningEvents());
    } catch (loadError) {
      setError(getLearningContentErrorMessage(loadError, "Unable to load events."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const featuredEvent = useMemo(() => events[0] ?? null, [events]);
  const calendarDays = useMemo(() => {
    if (events.length === 0) return [];
    return events.slice(0, 7).map((event) => {
      const date = new Date(event.startsAt);
      const weekday = Number.isNaN(date.getTime())
        ? "Day"
        : new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
      return { id: event.id, label: `${weekday} ${event.date}` };
    });
  }, [events]);

  return (
    <main className="events-page min-w-0 text-yome-text">
      <header className="page-heading flex items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Learn live</p>
          <h1>Events & Study Sessions</h1>
          <span>Join revision sessions, workshops, talks, and collaborative project meetings.</span>
        </div>
        <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">
          <Plus size={17} /> Create event
        </button>
      </header>

      <nav className="page-tabs flex items-center gap-2 overflow-x-auto">
        {["Discover", "Your events", "Hosting", "Past"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      <section className="events-calendar-strip card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
        <button>‹</button>
        {(calendarDays.length ? calendarDays : [{ id: "empty", label: "No events" }]).map((day, index) => (
          <button key={day.id} className={index === 0 ? "active" : ""}>
            <span>{day.label.split(" ")[0]}</span>
            <strong>{day.label.split(" ")[1] ?? ""}</strong>
            {events[index] ? <i /> : null}
          </button>
        ))}
        <button>›</button>
      </section>

      {tab === "Discover" ? (
        <>
          {isLoading ? (
            <EventState title="Loading events..." />
          ) : error ? (
            <EventState title="Events could not load" body={error} onRetry={() => void loadEvents()} />
          ) : !featuredEvent ? (
            <EventState title="No upcoming events" body="Events from your learning communities will appear here." />
          ) : (
            <section className="event-feature card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
              <div>
                <Badge tone={featuredEvent.tone}>Featured {featuredEvent.type.toLowerCase()}</Badge>
                <h2>{featuredEvent.title}</h2>
                <p>Join learners from {featuredEvent.host} for a live session focused on {featuredEvent.subject.toLowerCase()}.</p>
                <div className="event-host">
                  <Avatar initials={featuredEvent.subject.slice(0, 2).toUpperCase()} tone={featuredEvent.tone} />
                  <span>
                    <strong>{featuredEvent.host}</strong>
                    <small>{featuredEvent.subject} community</small>
                  </span>
                </div>
                <div className="event-feature-meta flex flex-wrap items-center gap-2">
                  <span><CalendarDays size={16} /><b>{featuredEvent.time}</b></span>
                  <span><Video size={16} /><b>{featuredEvent.type}</b></span>
                  <span><Users size={16} /><b>{featuredEvent.attending} attending</b></span>
                </div>
                <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">Reserve a place</button>
              </div>
              <div className="event-lesson-art">
                <div className="lesson-network"><span>{featuredEvent.subject}</span><i /><span>{featuredEvent.type}</span><i /><span>LIVE</span></div>
                <small>{featuredEvent.month} {featuredEvent.date}</small>
              </div>
            </section>
          )}

          <div className="events-list-heading">
            <div>
              <h2>Upcoming for you</h2>
              <p>Based on your groups and interests</p>
            </div>
            <select>
              <option>All event types</option>
              <option>Study sessions</option>
              <option>Workshops</option>
              <option>Talks</option>
            </select>
          </div>

          <div className="events-grid">
            {events.map((event) => {
              const isJoined = joined.includes(event.id);
              return (
                <article className="event-card-full card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={event.id}>
                  <div className={`event-date-large ${event.tone}`}>
                    <strong>{event.date}</strong>
                    <span>{event.month}</span>
                  </div>
                  <div>
                    <Badge tone={event.tone}>{event.type}</Badge>
                    <h3>{event.title}</h3>
                    <p>{event.time}</p>
                    <small>Hosted by {event.host}</small>
                    <div className="event-attendees">
                      <div className="stacked-avatars flex items-center">
                        <Avatar initials="SC" tone="teal" size="xs" />
                        <Avatar initials="AN" tone="amber" size="xs" />
                        <Avatar initials="MP" tone="violet" size="xs" />
                      </div>
                      <span>{event.attending} attending</span>
                    </div>
                  </div>
                  <button className={isJoined ? "secondary-button joined inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" : "primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"} onClick={() => setJoined((current) => isJoined ? current.filter((value) => value !== event.id) : [...current, event.id])}>
                    {isJoined ? <><Check size={15} /> Joined</> : "Join event"}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="groups-tab-state card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
          <div className="empty-icon"><CalendarDays size={30} /></div>
          <h2>{tab}</h2>
          <p>Your event schedule and hosting tools will appear here.</p>
          <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">Browse events</button>
        </div>
      )}
    </main>
  );
}
