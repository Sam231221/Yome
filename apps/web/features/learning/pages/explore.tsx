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

export function ExploreContent() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const trending = [
    { name: "Artificial Intelligence", posts: "2.4k discussions", tone: "blue" as YomeTone, symbol: "AI" },
    { name: "Quantum Physics", posts: "890 discussions", tone: "teal" as YomeTone, symbol: "phi" },
    { name: "Robotics", posts: "1.7k projects", tone: "amber" as YomeTone, symbol: "ENG" },
    { name: "Calculus", posts: "1.2k questions", tone: "violet" as YomeTone, symbol: "SIG" },
  ];
  const filtered = discoveryGroups.filter((group) =>
    `${group.title} ${group.detail} ${group.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="discover-page min-w-0 text-yome-text">
      <header className="discover-hero">
        <div>
          <p className="eyebrow">Explore Yome</p>
          <h1>Where curiosity leads</h1>
          <span>Discover people, ideas, and communities across STEM.</span>
        </div>
        <label className="discover-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics, groups, questions..." />
        </label>
      </header>
      <nav className="discover-categories">
        {["All", "Science", "Technology", "Engineering", "Mathematics"].map((item) => (
          <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </nav>
      {!query ? (
        <section className="trending-grid">
          <div className="discover-section-title flex items-end justify-between gap-5 items-center gap-4">
            <div>
              <h2>Trending now</h2>
              <p>Topics learners are discussing today</p>
            </div>
            <button>View all <ArrowRight size={14} /></button>
          </div>
          <div>
            {trending.map((topic, index) => (
              <article className="topic-card card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={topic.name}>
                <span className="topic-rank">0{index + 1}</span>
                <div className={`topic-symbol-large ${topic.tone}`}>{topic.symbol}</div>
                <h3>{topic.name}</h3>
                <p>{topic.posts}</p>
                <div className="trend-line"><i style={{ width: `${88 - index * 12}%` }} /></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <section className="discover-groups">
        <div className="discover-section-title flex items-end justify-between gap-5 items-center gap-4">
          <div>
            <h2>{query ? `Results for "${query}"` : "Suggested communities"}</h2>
            <p>{query ? `${filtered.length} communities found` : "Based on your interests and learning goals"}</p>
          </div>
          <Link href="/groups">Browse groups <ArrowRight size={14} /></Link>
        </div>
        <div className="discovery-group-grid">
          {filtered.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="no-results card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <Search size={27} />
            <h3>No communities found</h3>
            <p>Try a broader STEM topic or clear your search.</p>
            <button onClick={() => setQuery("")}>Clear search</button>
          </div>
        ) : null}
      </section>
      {!query ? (
        <section className="explore-lower">
          <article className="popular-question card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <div className="section-kicker violet">Popular question</div>
            <Badge tone="violet">Machine Learning · Mathematics</Badge>
            <h2>Why do neural networks need activation functions?</h2>
            <p>
              Without them, wouldn&apos;t adding more layers still let the network learn more
              complex patterns?
            </p>
            <footer>
              <span><strong>24</strong> answers · <strong>86</strong> helpful</span>
              <button>Join discussion <ArrowRight size={14} /></button>
            </footer>
          </article>
          <article className="learning-path card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <div className="section-kicker blue">Learning path</div>
            <h2>Start building with Python</h2>
            <p>A community-curated path from fundamentals to your first useful project.</p>
            <div className="path-steps">
              <span className="done">✓</span><i /><span>2</span><i /><span>3</span><i /><span>4</span>
            </div>
            <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">Continue path</button>
          </article>
        </section>
      ) : null}
    </main>
  );
}
