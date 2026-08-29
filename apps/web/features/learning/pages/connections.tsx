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

export function ConnectionsContent() {
  const [tab, setTab] = useState("Suggestions");
  const [states, setStates] = useState<Record<string, string | null>>({});
  const people = [
    { name: "Priya Sharma", role: "AI student · Imperial College", shared: "AI, Robotics · 5 mutual groups", initials: "PS", tone: "violet" as YomeTone },
    { name: "Leo Martins", role: "Physics student · Lisbon", shared: "Physics, Astronomy · 3 mutual groups", initials: "LM", tone: "teal" as YomeTone },
    { name: "Amara Okafor", role: "Data Science student · Lagos", shared: "Python, Statistics · 4 mutual groups", initials: "AO", tone: "blue" as YomeTone },
    { name: "Noah Williams", role: "Engineering student · Bristol", shared: "Robotics, Electronics · 2 mutual groups", initials: "NW", tone: "amber" as YomeTone },
  ];

  return (
    <main className="connections-page min-w-0 text-yome-text">
      <header className="page-heading flex items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Your network</p>
          <h1>Connections</h1>
          <span>Build an academic network around shared interests and useful collaboration.</span>
        </div>
        <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue"><Search size={17} /> Find people</button>
      </header>
      <div className="connection-summary">
        <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome"><strong>186</strong><span>Connections</span></article>
        <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome"><strong>12</strong><span>Pending requests</span></article>
        <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome"><strong>34</strong><span>People you follow</span></article>
        <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome"><strong>8</strong><span>Shared communities</span></article>
      </div>
      <nav className="page-tabs connection-tabs flex items-center gap-2 overflow-x-auto">
        {["Suggestions", "Requests", "Your connections", "Following"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
            {item === "Requests" ? <em>12</em> : null}
          </button>
        ))}
      </nav>
      {tab === "Suggestions" ? (
        <div className="connections-grid">
          {people.map((person) => {
            const state = states[person.name];
            return (
              <article className="connection-card card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={person.name}>
                <div className="connection-cover"><div className="cover-grid" /></div>
                <Avatar initials={person.initials} tone={person.tone} size="lg" />
                <button className="more-button inline-grid shrink-0 place-items-center rounded-full text-yome-muted"><MoreHorizontal size={18} /></button>
                <h3>{person.name}</h3>
                <p>{person.role}</p>
                <small>{person.shared}</small>
                <div className="connection-tags"><Badge tone={person.tone}>Shared interests</Badge></div>
                <footer>
                  {state === "sent" ? (
                    <button className="secondary-button sent inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" onClick={() => setStates((curr) => ({ ...curr, [person.name]: null }))}>
                      <Check size={15} /> Request sent
                    </button>
                  ) : (
                    <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white" onClick={() => setStates((curr) => ({ ...curr, [person.name]: "sent" }))}>
                      <Plus size={15} /> Connect
                    </button>
                  )}
                  <Link className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" href="/chat"><MessageCircle size={15} /></Link>
                </footer>
              </article>
            );
          })}
        </div>
      ) : null}
      {tab === "Requests" ? (
        <div className="requests-list card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
          {people.slice(0, 3).map((person) => (
            <article key={person.name}>
              <Avatar initials={person.initials} tone={person.tone} />
              <div>
                <strong>{person.name}</strong>
                <p>{person.role}</p>
                <small>{person.shared}</small>
              </div>
              <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">Accept</button>
              <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue">Decline</button>
            </article>
          ))}
        </div>
      ) : null}
      {tab !== "Suggestions" && tab !== "Requests" ? (
        <div className="connection-list card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
          {people.map((person) => (
            <article key={person.name}>
              <Avatar initials={person.initials} tone={person.tone} />
              <div>
                <strong>{person.name}</strong>
                <p>{person.role}</p>
              </div>
              <Badge tone="neutral">Connected</Badge>
              <Link className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" href="/chat"><MessageCircle size={15} /> Message</Link>
              <button className="more-button inline-grid shrink-0 place-items-center rounded-full text-yome-muted"><MoreHorizontal size={18} /></button>
            </article>
          ))}
        </div>
      ) : null}
    </main>
  );
}

