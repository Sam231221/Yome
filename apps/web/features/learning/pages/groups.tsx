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

export function GroupsContent() {
  const [tab, setTab] = useState("Discover");

  return (
    <main className="groups-page min-w-0 text-yome-text">
      <header className="page-heading flex items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Communities</p>
          <h1>Learn better together</h1>
          <span>Find a focused group or create a space for your community.</span>
        </div>
        <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"><Plus size={17} /> Create group</button>
      </header>
      <nav className="page-tabs flex items-center gap-2 overflow-x-auto">
        {["Discover", "Your groups", "Invitations"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
            {item === "Invitations" ? <em>2</em> : null}
          </button>
        ))}
      </nav>
      {tab === "Discover" ? (
        <>
          <section className="group-feature card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <div className="group-feature-copy">
              <Badge tone="amber">Featured community</Badge>
              <h2>Build something real with the Robotics Club</h2>
              <p>
                Join this month&apos;s challenge: design a low-cost environmental sensor and
                share your prototype with learners around the world.
              </p>
              <div>
                <span>7.8k members</span>
                <span>184 projects</span>
                <span>32 mentors</span>
              </div>
              <Link className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white" href="/groups/robotics-team">
                Explore the club <ArrowRight size={16} />
              </Link>
            </div>
            <div className="robot-diagram" aria-hidden="true">
              <span className="robot-head"><i /><i /></span>
              <span className="robot-body">Y</span>
              <b className="circuit c1" />
              <b className="circuit c2" />
              <b className="circuit c3" />
            </div>
          </section>
          <div className="groups-filter">
            <label><Search size={17} /><input placeholder="Search communities..." /></label>
            <button>All subjects⌄</button>
            <button>Most active⌄</button>
          </div>
          <div className="group-list-grid">
            {discoveryGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </>
      ) : (
        <div className="groups-tab-state card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
          <div className="empty-icon"><UsersRound size={30} /></div>
          <h2>{tab}</h2>
          <p>{tab === "Your groups" ? "Your Python, Physics, and Robotics communities will appear here." : "You have two invitations ready to review."}</p>
          <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">{tab === "Your groups" ? "Explore groups" : "Review invitations"}</button>
        </div>
      )}
    </main>
  );
}
