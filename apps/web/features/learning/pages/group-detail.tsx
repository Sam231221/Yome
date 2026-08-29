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

export function GroupDetailContent({ id }: { id: string }) {
  const [tab, setTab] = useState("Discussion");
  const [joined, setJoined] = useState(true);
  const group = groups.find((item) => item.id === id) ?? groups[2] ?? groups[0];
  const tabs = ["Discussion", "Questions", "Resources", "Members", "Events", "About"];

  return (
    <main className="group-detail-page min-w-0 text-yome-text">
      <Link className="back-link inline-flex items-center gap-2 font-bold text-yome-blue" href="/groups">← All groups</Link>
      <section className="group-detail-hero card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
        <div className="group-detail-cover">
          <div className="cover-grid" />
          <span className="robot-head group-robot-head"><i /><i /></span>
          <span className="robot-body group-robot-body">Y</span>
          <span className="group-cover-code">BUILD · TEST · LEARN · REPEAT</span>
        </div>
        <div className="group-detail-summary">
          <div className="group-detail-logo">{group.symbol}</div>
          <div>
            <div className="group-name-line">
              <h1>{group.name}</h1>
              <span className="verified">✓</span>
            </div>
            <p>Engineering · Technology</p>
            <small>7,842 members · 486 active this week</small>
          </div>
          <div className="group-detail-actions flex flex-wrap items-center gap-2">
            <button className={joined ? "secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" : "primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"} onClick={() => setJoined((v) => !v)}>
              {joined ? <>Joined</> : "Join group"}
            </button>
            <Link className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" href="/chat">
              <MessageCircle size={16} /> Group chat
            </Link>
            <button className="icon-button inline-grid shrink-0 place-items-center rounded-yome border border-yome-border bg-yome-surface text-yome-muted"><MoreHorizontal size={18} /></button>
          </div>
        </div>
        <p className="group-description">
          A collaborative community for learners building robots, electronics, and
          intelligent machines from first Arduino projects to advanced autonomous systems.
        </p>
        <div className="group-chips flex flex-wrap items-center gap-2">
          <Badge tone="amber">Robotics</Badge>
          <Badge tone="blue">Programming</Badge>
          <Badge tone="teal">Electronics</Badge>
          <Badge tone="neutral">Project based</Badge>
        </div>
        <nav className="group-detail-tabs">
          {tabs.map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </nav>
      </section>
      <div className="group-detail-layout">
        <section className="group-detail-main">
          {tab === "Discussion" ? (
            <>
              <article className="group-announcement card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
                <div className="announcement-mark">⌘</div>
                <div>
                  <Badge tone="amber">Pinned announcement</Badge>
                  <h2>August build challenge: environmental sensor</h2>
                  <p>
                    Design a low-cost sensor that measures one environmental condition.
                    Share your plan by Friday and join the live mentor session this weekend.
                  </p>
                  <footer>
                    <Avatar initials="DR" tone="blue" size="xs" />
                    <span>Dr. Rivera · Group educator</span>
                    <button>View challenge <ArrowRight size={14} /></button>
                  </footer>
                </div>
              </article>
              <QuestionCard />
            </>
          ) : null}
          {tab === "Questions" ? (
            <>
              <div className="group-tab-heading">
                <div>
                  <h2>Questions</h2>
                  <p>Get help from 7,842 robotics learners.</p>
                </div>
                <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">Ask a question</button>
              </div>
              <QuestionCard />
            </>
          ) : null}
          {tab === "Resources" ? (
            <div className="resource-grid">
              <article className="resource-item card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
                <span className="resource-type pdf">PDF</span>
                <Badge tone="amber">Beginner</Badge>
                <h3>Arduino sensor starter guide</h3>
                <p>Wiring patterns, calibration tips, and example code.</p>
                <footer><span>Dr. Rivera · 2.1k saves</span><button><Bookmark size={16} /></button></footer>
              </article>
              <article className="resource-item card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
                <span className="resource-type code">CODE</span>
                <Badge tone="blue">Repository</Badge>
                <h3>Robotics Club example projects</h3>
                <p>Community-maintained starter projects and reusable modules.</p>
                <footer><span>Club team · 1.4k saves</span><button><Bookmark size={16} /></button></footer>
              </article>
            </div>
          ) : null}
          {tab === "Members" ? <MembersGrid /> : null}
          {tab === "Events" ? (
            <div className="event-list">
              <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
                <div className="date-tile"><strong>30</strong><span>AUG</span></div>
                <div><Badge tone="blue">Live workshop</Badge><h3>Build challenge mentor session</h3><p>Saturday · 2:30 PM · Video study room</p></div>
                <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">Join event</button>
              </article>
              <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
                <div className="date-tile amber"><strong>04</strong><span>SEP</span></div>
                <div><Badge tone="amber">Project review</Badge><h3>Prototype feedback circle</h3><p>Thursday · 5:00 PM · Group room</p></div>
                <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue">Interested</button>
              </article>
            </div>
          ) : null}
          {tab === "About" ? (
            <div className="group-about card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
              <h2>About this community</h2>
              <p>
                The Robotics Club welcomes students, educators, makers, and mentors at every
                level. We learn through practical builds, respectful technical discussion, and
                shared documentation.
              </p>
              <h3>Group rules</h3>
              <ol>
                <li>Keep feedback constructive and specific.</li>
                <li>Credit teammates and source material.</li>
                <li>Use the correct question and resource tags.</li>
                <li>Report unsafe projects or inappropriate content.</li>
              </ol>
            </div>
          ) : null}
        </section>
        <aside className="group-detail-aside">
          <section className="card group-side-card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h3>About</h3>
            <div><span>Privacy</span><strong>Public group</strong></div>
            <div><span>Created</span><strong>March 2023</strong></div>
            <div><span>Location</span><strong>Global</strong></div>
            <button>Read group rules</button>
          </section>
          <section className="card group-side-card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <div className="section-title flex items-center justify-between gap-4"><h3>Group moderators</h3><button>View all</button></div>
            <div className="moderator"><Avatar initials="DR" tone="blue" /><span><strong>Dr. Elena Rivera</strong><small>Educator · Owner</small></span></div>
            <div className="moderator"><Avatar initials="AN" tone="amber" /><span><strong>Alex Nguyen</strong><small>Moderator</small></span></div>
          </section>
          <section className="card group-side-card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h3>Active study room</h3>
            <div className="active-group-room"><span className="live-dot" /><div><strong>Build challenge help</strong><small>18 studying now</small></div></div>
            <button className="join-room-wide"><Headphones size={16} /> Join room</button>
          </section>
        </aside>
      </div>
    </main>
  );
}
