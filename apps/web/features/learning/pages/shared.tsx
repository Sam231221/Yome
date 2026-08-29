"use client";

import Link from "next/link";
import { Bookmark, Check, MessageCircle, MoreHorizontal, Share2 } from "lucide-react";
import { useState } from "react";
import { Avatar, Badge } from "@/components/ui";
import type { YomeTone } from "@/features/learning/data";

export type DiscoveryGroup = {
  id: string;
  title: string;
  members: string;
  detail: string;
  symbol: string;
  tone: YomeTone;
  tags: string[];
};

export const discoveryGroups: DiscoveryGroup[] = [
  {
    id: "python-learners",
    title: "AI & Machine Learning",
    members: "18.4k members",
    detail: "Build intuition, discuss papers, and learn by making.",
    symbol: "AI",
    tone: "blue",
    tags: ["Python", "Data Science"],
  },
  {
    id: "physics-club",
    title: "Physics Problem Solvers",
    members: "9.2k members",
    detail: "Work through physics problems from first principles.",
    symbol: "phi",
    tone: "teal",
    tags: ["Mechanics", "Quantum"],
  },
  {
    id: "robotics-team",
    title: "Robotics Club",
    members: "7.8k members",
    detail: "Electronics, mechanics, code, and collaborative builds.",
    symbol: "ENG",
    tone: "amber",
    tags: ["Arduino", "Engineering"],
  },
  {
    id: "calculus-circle",
    title: "Calculus Study Lab",
    members: "6.1k members",
    detail: "Friendly problem-solving sessions and shared revision notes.",
    symbol: "SIG",
    tone: "violet",
    tags: ["Mathematics", "Study rooms"],
  },
];

export function GroupCard({ group }: { group: DiscoveryGroup }) {
  const [joined, setJoined] = useState(group.id === "robotics-team");

  return (
    <article className="discovery-group card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
      <Link className={`group-cover ${group.tone}`} href={`/groups/${group.id}`}>
        <span>{group.symbol}</span>
        <i />
        <i />
        <i />
      </Link>
      <div className="discovery-group-body">
        <div className="group-title-row flex items-start justify-between gap-4">
          <div>
            <Link className="group-title-link" href={`/groups/${group.id}`}>
              {group.title}
            </Link>
            <small>{group.members} · Active today</small>
          </div>
          <button
            className={joined ? "secondary-button joined inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" : "primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"}
            onClick={() => setJoined((value) => !value)}
          >
            {joined ? "Joined" : "Join group"}
          </button>
        </div>
        <p>{group.detail}</p>
        <div>
          {group.tags.map((tag, index) => (
            <Badge key={tag} tone={index ? "neutral" : group.tone}>
              {tag}
            </Badge>
          ))}
        </div>
        <footer>
          <div className="stacked-avatars flex items-center">
            <Avatar initials="SC" tone="teal" size="xs" />
            <Avatar initials="AN" tone="amber" size="xs" />
            <Avatar initials="MP" tone="violet" size="xs" />
          </div>
          <span>12 people you may know</span>
        </footer>
      </div>
    </article>
  );
}

export function QuestionCard() {
  const [helpful, setHelpful] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <article className="post card question-post rounded-yome border border-yome-border bg-yome-surface shadow-yome">
      <div className="post-accent" style={{ background: "var(--yome-violet)" }} />
      <header className="post-header">
        <Avatar initials="SC" tone="teal" />
        <div className="author">
          <div>
            <strong>Sarah Chen</strong>
            <span className="verified">✓</span>
          </div>
          <small>Mathematics student · 2h</small>
        </div>
        <Badge tone="violet">Question</Badge>
        <button className="more-button inline-grid shrink-0 place-items-center rounded-full text-yome-muted" aria-label="Post options">
          <MoreHorizontal size={18} />
        </button>
      </header>
      <div className="post-content">
        <div className="topic-row">
          <Badge tone="violet">Mathematics</Badge>
          <Badge tone="neutral">Calculus</Badge>
        </div>
        <h2>Can someone explain integration by parts intuitively?</h2>
        <p>
          I understand the formula, but I&apos;m struggling to see why it works
          geometrically. Is there a visual way to think about it?
        </p>
      </div>
      <div className="answer-preview">
        <span className="answer-avatar">✓</span>
        <div>
          <strong>Top answer from Dr. James Liu</strong>
          <p>
            Think of it as reversing the product rule: you&apos;re redistributing which
            function gets differentiated...
          </p>
        </div>
        <button>Read answer</button>
      </div>
      <div className="post-stats">
        <span>
          <strong>{helpful ? 13 : 12}</strong> Helpful
        </span>
        <span>8 answers · 3 shares</span>
      </div>
      <footer className="post-actions flex items-center gap-2">
        <button className={helpful ? "post-action active inline-flex items-center justify-center gap-2 rounded-yome font-bold text-yome-muted" : "post-action inline-flex items-center justify-center gap-2 rounded-yome font-bold text-yome-muted"} onClick={() => setHelpful((v) => !v)}>
          <Check size={17} />
          <span>Helpful</span>
        </button>
        <button className="post-action inline-flex items-center justify-center gap-2 rounded-yome font-bold text-yome-muted">
          <MessageCircle size={17} />
          <span>Answer</span>
        </button>
        <button className="post-action inline-flex items-center justify-center gap-2 rounded-yome font-bold text-yome-muted">
          <Share2 size={17} />
          <span>Share</span>
        </button>
        <button className={saved ? "post-action active inline-flex items-center justify-center gap-2 rounded-yome font-bold text-yome-muted" : "post-action inline-flex items-center justify-center gap-2 rounded-yome font-bold text-yome-muted"} onClick={() => setSaved((v) => !v)}>
          <Bookmark size={17} />
          <span>Save</span>
        </button>
      </footer>
    </article>
  );
}

export function MembersGrid() {
  const members = [
    { name: "Dr. Elena Rivera", role: "Educator · Robotics", initials: "DR", tone: "blue" as YomeTone },
    { name: "Alex Nguyen", role: "Engineering student", initials: "AN", tone: "amber" as YomeTone },
    { name: "Priya Sharma", role: "AI · Robotics", initials: "PS", tone: "violet" as YomeTone },
    { name: "Leo Martins", role: "Physics · Electronics", initials: "LM", tone: "teal" as YomeTone },
    { name: "Sarah Chen", role: "Mathematics student", initials: "SC", tone: "teal" as YomeTone },
    { name: "Maya Patel", role: "Computer Science", initials: "MP", tone: "violet" as YomeTone },
  ];

  return (
    <div className="members-grid">
      {members.map((person) => (
        <article className="member-card card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={person.name}>
          <Avatar initials={person.initials} tone={person.tone} size="lg" />
          <h3>{person.name}</h3>
          <p>{person.role}</p>
          <span>3 shared groups</span>
          <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue">View profile</button>
        </article>
      ))}
    </div>
  );
}
