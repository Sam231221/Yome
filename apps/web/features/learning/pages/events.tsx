"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  FileText,
  Headphones,
  HelpCircle,
  MessageCircle,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Settings,
  Share2,
  Users,
  UsersRound,
  Video,
} from "lucide-react";
import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Avatar, Badge } from "@/components/ui";
import { groups, onboardingGoals, onboardingInterests, type YomeTone } from "@/features/learning/data";
import { discoveryGroups, GroupCard, MembersGrid, QuestionCard } from "./shared";

export function EventsContent() {
  const [tab, setTab] = useState("Discover");
  const [joined, setJoined] = useState<string[]>([]);
  const events = [
    { title: "Calculus Revision Session", date: "28", month: "AUG", time: "Today · 4:00 PM", host: "Mathematics Study Group", attending: 24, tone: "violet" as YomeTone, type: "Study session" },
    { title: "Intro to Machine Learning", date: "30", month: "AUG", time: "Saturday · 2:30 PM", host: "AI & ML Community", attending: 42, tone: "blue" as YomeTone, type: "Live lesson" },
    { title: "Arduino Build Clinic", date: "02", month: "SEP", time: "Tuesday · 5:00 PM", host: "Robotics Club", attending: 28, tone: "amber" as YomeTone, type: "Workshop" },
    { title: "Quantum Physics Q&A", date: "04", month: "SEP", time: "Thursday · 6:30 PM", host: "Physics Problem Solvers", attending: 67, tone: "teal" as YomeTone, type: "STEM talk" },
  ];

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
        {["Thu 27", "Fri 28", "Sat 29", "Sun 30", "Mon 31", "Tue 01", "Wed 02"].map((day, index) => (
          <button key={day} className={index === 1 ? "active" : ""}>
            <span>{day.split(" ")[0]}</span>
            <strong>{day.split(" ")[1]}</strong>
            {[1, 3, 6].includes(index) ? <i /> : null}
          </button>
        ))}
        <button>›</button>
      </section>

      {tab === "Discover" ? (
        <>
          <section className="event-feature card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <div>
              <Badge tone="blue">Featured live lesson</Badge>
              <h2>How machines learn: a visual introduction</h2>
              <p>Build an intuitive understanding of datasets, models, loss, and training with no advanced mathematics required.</p>
              <div className="event-host">
                <Avatar initials="JL" tone="blue" />
                <span>
                  <strong>Dr. James Liu</strong>
                  <small>Educator · AI & Machine Learning</small>
                </span>
              </div>
              <div className="event-feature-meta flex flex-wrap items-center gap-2">
                <span><CalendarDays size={16} /><b>Saturday, 2:30 PM</b></span>
                <span><Video size={16} /><b>Live video session</b></span>
                <span><Users size={16} /><b>42 attending</b></span>
              </div>
              <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">Reserve a place</button>
            </div>
            <div className="event-lesson-art">
              <div className="lesson-network"><span>DATA</span><i /><span>MODEL</span><i /><span>IDEA</span></div>
              <small>LIVE · 30 AUG · 14:30</small>
            </div>
          </section>

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
              const isJoined = joined.includes(event.title);
              return (
                <article className="event-card-full card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={event.title}>
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
                  <button className={isJoined ? "secondary-button joined inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" : "primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"} onClick={() => setJoined((current) => isJoined ? current.filter((value) => value !== event.title) : [...current, event.title])}>
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
