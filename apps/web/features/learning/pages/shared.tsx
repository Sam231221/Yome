"use client";

import Link from "next/link";
import { Bookmark, Check, MessageCircle, MoreHorizontal, Share2 } from "lucide-react";
import { useState } from "react";
import { Avatar, Badge } from "@/components/ui";
import { groups, type YomeTone } from "@/features/learning/data";
import type { LearningGroup, LearningUser } from "@/lib/learning/learningApi";

export type DiscoveryGroup = {
  id: string;
  title: string;
  members: string;
  detail: string;
  symbol: string;
  tone: YomeTone;
  tags: string[];
};

export const discoveryGroups: LearningGroup[] = groups.map((group) => ({
  id: group.id,
  slug: group.id,
  title: group.name,
  name: group.name,
  members: group.members,
  memberCount: 0,
  detail: group.about,
  about: group.about,
  subject: group.level,
  category: "Community",
  symbol: group.symbol,
  tone: group.tone,
  thumbnail: "",
  tags: [{ label: group.level, tone: group.tone }],
  featured: false,
  activeThisWeek: 0,
  projectCount: 0,
  mentorCount: 0,
  resourceCount: 0,
  isJoined: group.joined,
}));

export function GroupCard({
  group,
  onJoin,
}: {
  group: LearningGroup;
  onJoin?: (group: LearningGroup) => Promise<void> | void;
}) {
  const [joined, setJoined] = useState(group.isJoined);
  const [isJoining, setIsJoining] = useState(false);
  const tags = group.tags.length
    ? group.tags
    : [{ label: group.subject, tone: group.tone }];

  const handleJoin = async () => {
    if (joined || isJoining) return;
    setIsJoining(true);
    try {
      await onJoin?.(group);
      setJoined(true);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <article className="discovery-group card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
      <Link className={`group-cover ${group.tone}`} href={`/groups/${group.slug || group.id}`}>
        <span>{group.symbol}</span>
        <i />
        <i />
        <i />
      </Link>
      <div className="discovery-group-body">
        <div className="group-title-row flex items-start justify-between gap-4">
          <div>
            <Link className="group-title-link" href={`/groups/${group.slug || group.id}`}>
              {group.title}
            </Link>
            <small>{group.members} · {group.activeThisWeek} active this week</small>
          </div>
          <button
            className={joined ? "secondary-button joined inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" : "primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"}
            disabled={isJoining}
            onClick={handleJoin}
          >
            {joined ? "Joined" : isJoining ? "Joining..." : "Join group"}
          </button>
        </div>
        <p>{group.detail}</p>
        <div>
          {tags.map((tag, index) => (
            <Badge key={tag.label} tone={index ? "neutral" : tag.tone}>
              {tag.label}
            </Badge>
          ))}
        </div>
        <footer>
          <div className="stacked-avatars flex items-center">
            <Avatar initials="SC" tone="teal" size="xs" />
            <Avatar initials="AN" tone="amber" size="xs" />
            <Avatar initials="MP" tone="violet" size="xs" />
          </div>
          <span>{group.mentorCount} mentors · {group.projectCount} projects</span>
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

export function MembersGrid({ members }: { members: LearningUser[] }) {
  return (
    <div className="members-grid">
      {members.map((person) => (
        <article className="member-card card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={person.id}>
          <Avatar initials={person.initials} tone={person.tone} size="lg" />
          <h3>{person.name}</h3>
          <p>{person.role}</p>
          <span>{person.shared}</span>
          <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue">View profile</button>
        </article>
      ))}
    </div>
  );
}
