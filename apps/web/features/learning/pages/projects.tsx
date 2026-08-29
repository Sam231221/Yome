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

export function ProjectsContent() {
  const [filter, setFilter] = useState("Featured");
  const projectsData = [
    { id: "arduino-smart-greenhouse", title: "Arduino Smart Greenhouse", subject: "Engineering", tags: ["Arduino", "C++", "Electronics"], tone: "amber" as YomeTone, team: "4 students", progress: "Prototype complete", initials: "SG", description: "An automated greenhouse that monitors soil, light, and temperature." },
    { id: "accessible-campus-navigator", title: "Accessible Campus Navigator", subject: "Technology", tags: ["Computer Vision", "Python", "Accessibility"], tone: "blue" as YomeTone, team: "3 students", progress: "Testing", initials: "CN", description: "Indoor navigation assistance for visually impaired students." },
    { id: "open-source-air-quality-map", title: "Open-source Air Quality Map", subject: "Science", tags: ["Data Science", "Sensors", "Environment"], tone: "teal" as YomeTone, team: "6 contributors", progress: "Live beta", initials: "AQ", description: "Community sensors visualized as an open local air-quality map." },
    { id: "visual-calculus-explorer", title: "Visual Calculus Explorer", subject: "Mathematics", tags: ["React", "Graphs", "Calculus"], tone: "violet" as YomeTone, team: "2 students", progress: "In progress", initials: "VC", description: "Interactive graphs that connect calculus notation to geometric intuition." },
  ];

  return (
    <main className="projects-page min-w-0 text-yome-text">
      <header className="page-heading flex items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Learn by building</p>
          <h1>Projects</h1>
          <span>Discover student work, share progress, and find collaborators.</span>
        </div>
        <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">
          <Plus size={17} /> Add project
        </button>
      </header>

      <section className="project-feature card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
        <div>
          <Badge tone="blue">Project of the week</Badge>
          <h2>Accessible Campus Navigator</h2>
          <p>A student team is combining computer vision, accessible design, and indoor mapping to help visually impaired learners navigate unfamiliar university buildings.</p>
          <div className="project-feature-tags">
            <Badge tone="blue">Computer Vision</Badge>
            <Badge tone="violet">Accessibility</Badge>
            <Badge tone="neutral">Python</Badge>
          </div>
          <div className="project-team-row">
            <div className="proof-avatars flex items-center">
              <Avatar initials="MP" tone="violet" />
              <Avatar initials="AN" tone="amber" />
              <Avatar initials="PS" tone="teal" />
            </div>
            <span>
              <strong>3 collaborators</strong>
              <small>University of Manchester</small>
            </span>
          </div>
          <Link className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white" href="/projects/accessible-campus-navigator">
            View project <ArrowRight size={16} />
          </Link>
        </div>
        <div className="campus-map-art">
          <div className="map-grid" />
          <span className="map-building b1">A</span>
          <span className="map-building b2">B</span>
          <span className="map-building b3">C</span>
          <div className="map-route"><i /><i /><i /><i /></div>
          <span className="map-you">YOU</span>
          <small>ACCESSIBLE ROUTE · 4 MIN</small>
        </div>
      </section>

      <nav className="project-filters">
        {["Featured", "Recently updated", "Seeking collaborators", "Following"].map((item) => (
          <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
        <span />
        <select>
          <option>All subjects</option>
          <option>Science</option>
          <option>Technology</option>
          <option>Engineering</option>
          <option>Mathematics</option>
        </select>
      </nav>

      <div className="projects-grid">
        {projectsData.map((project, index) => (
          <article className="project-card-full card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={project.id}>
            <Link className={`project-card-art ${project.tone}`} href={`/projects/${project.id}`}>
              <span>{project.initials}</span>
              <div className="project-art-grid" />
              <i className="project-art-node n1" />
              <i className="project-art-node n2" />
              <i className="project-art-node n3" />
            </Link>
            <div>
              <Badge tone={project.tone}>{project.subject}</Badge>
              <Link className="project-title-link" href={`/projects/${project.id}`}>
                {project.title}
              </Link>
              <p>{project.description}</p>
              <div className="project-tags flex flex-wrap items-center gap-2">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <footer>
                <div>
                  <Avatar initials={["AN", "MP", "AO", "SC"][index]} tone={project.tone} size="xs" />
                  <span>{project.team}</span>
                </div>
                <Badge tone="neutral">{project.progress}</Badge>
              </footer>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

export function ProjectDetailContent({ id }: { id: string }) {
  const [follow, setFollow] = useState(false);
  const [tab, setTab] = useState("Overview");
  const projectsData = [
    { id: "arduino-smart-greenhouse", title: "Arduino Smart Greenhouse", subject: "Engineering", tags: ["Arduino", "C++", "Electronics"], tone: "amber" as YomeTone, team: "4 students", progress: "Prototype complete", initials: "SG", description: "An automated greenhouse that monitors soil, light, and temperature." },
    { id: "accessible-campus-navigator", title: "Accessible Campus Navigator", subject: "Technology", tags: ["Computer Vision", "Python", "Accessibility"], tone: "blue" as YomeTone, team: "3 students", progress: "Testing", initials: "CN", description: "Indoor navigation assistance for visually impaired students." },
    { id: "open-source-air-quality-map", title: "Open-source Air Quality Map", subject: "Science", tags: ["Data Science", "Sensors", "Environment"], tone: "teal" as YomeTone, team: "6 contributors", progress: "Live beta", initials: "AQ", description: "Community sensors visualized as an open local air-quality map." },
    { id: "visual-calculus-explorer", title: "Visual Calculus Explorer", subject: "Mathematics", tags: ["React", "Graphs", "Calculus"], tone: "violet" as YomeTone, team: "2 students", progress: "In progress", initials: "VC", description: "Interactive graphs that connect calculus notation to geometric intuition." },
  ];
  const project = projectsData.find((item) => item.id === id) ?? projectsData[0];

  return (
    <main className="project-detail-page min-w-0 text-yome-text">
      <Link className="back-link inline-flex items-center gap-2 font-bold text-yome-blue" href="/projects">← All projects</Link>
      <section className="project-detail-hero card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
        <div className={`project-detail-art ${project.tone}`}>
          <div className="project-art-grid" />
          <span className="project-device"><i /><i /><i /></span>
          <div className="project-readout">
            <span>STATUS</span>
            <strong>ONLINE</strong>
            <span>PROGRESS</span>
            <strong>82%</strong>
          </div>
        </div>
        <div className="project-detail-copy">
          <Badge tone={project.tone}>{project.subject}</Badge>
          <h1>{project.title}</h1>
          <p>{project.description} The team is documenting every stage so other learners can reproduce and improve the work.</p>
          <div className="project-tags flex flex-wrap items-center gap-2">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <div className="project-detail-team">
            <div className="proof-avatars flex items-center">
              <Avatar initials="MP" tone="violet" />
              <Avatar initials="AN" tone="amber" />
              <Avatar initials="PS" tone="teal" />
            </div>
            <span>
              <strong>{project.team}</strong>
              <small>Updated 2 days ago</small>
            </span>
          </div>
          <div className="project-detail-actions flex flex-wrap items-center gap-2">
            <button className={follow ? "secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" : "primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"} onClick={() => setFollow((value) => !value)}>
              {follow ? <><Check size={16} /> Following</> : <><Plus size={16} /> Follow project</>}
            </button>
            <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue">
              <MessageCircle size={16} /> Contact team
            </button>
            <button className="icon-button inline-grid shrink-0 place-items-center rounded-yome border border-yome-border bg-yome-surface text-yome-muted">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </section>

      <nav className="project-detail-tabs">
        {["Overview", "Updates", "Team", "Resources", "Feedback"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      <div className="project-detail-layout">
        <section>
          {tab === "Overview" ? (
            <>
              <article className="card project-story rounded-yome border border-yome-border bg-yome-surface shadow-yome">
                <h2>The problem</h2>
                <p>Small learning projects often stop at a prototype because documentation, testing, and collaboration are scattered. This team is making each decision visible and reusable.</p>
                <h2>How it works</h2>
                <div className="project-process">
                  <div><span>01</span><strong>Sense</strong><p>Collect environmental measurements.</p></div>
                  <i />
                  <div><span>02</span><strong>Decide</strong><p>Compare values with safe thresholds.</p></div>
                  <i />
                  <div><span>03</span><strong>Act</strong><p>Trigger the right response and log it.</p></div>
                </div>
                <h2>Current progress</h2>
                <div className="project-progress"><span><b style={{ width: "82%" }} /></span><strong>82% · Prototype testing</strong></div>
              </article>

              <article className="card project-update rounded-yome border border-yome-border bg-yome-surface shadow-yome">
                <header>
                  <Avatar initials="AN" tone="amber" />
                  <div>
                    <strong>Alex Nguyen</strong>
                    <small>Project update · 2 days ago</small>
                  </div>
                </header>
                <h3>Sensor calibration is complete</h3>
                <p>We ran three test cycles and reduced the average measurement error. Next, we&apos;re documenting the enclosure design.</p>
                <footer>
                  <button><HelpCircle size={15} /> Helpful</button>
                  <button><MessageCircle size={15} /> 8 comments</button>
                </footer>
              </article>
            </>
          ) : (
            <div className="groups-tab-state card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
              <div className="empty-icon">
                {tab === "Team" ? <Users size={29} /> : tab === "Resources" ? <Bookmark size={29} /> : <MessageCircle size={29} />}
              </div>
              <h2>{tab}</h2>
              <p>This project section is ready for team records and ongoing contributions.</p>
            </div>
          )}
        </section>

        <aside>
          <section className="card project-side rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h3>Project details</h3>
            <div><span>Status</span><strong>{project.progress}</strong></div>
            <div><span>Started</span><strong>May 2026</strong></div>
            <div><span>License</span><strong>Open source</strong></div>
            <div><span>Feedback</span><strong>Welcome</strong></div>
          </section>
          <section className="card project-side rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h3>Looking for</h3>
            <Badge tone="blue">UI feedback</Badge>
            <Badge tone="teal">Testing partners</Badge>
            <Badge tone="amber">Electronics mentor</Badge>
            <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">Offer to help</button>
          </section>
          <section className="card project-side rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h3>External links</h3>
            <button className="project-link inline-flex w-full items-center justify-between gap-3 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-navy"><FileText size={16} /> Source repository <ArrowRight size={14} /></button>
            <button className="project-link inline-flex w-full items-center justify-between gap-3 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-navy"><FileText size={16} /> Project documentation <ArrowRight size={14} /></button>
          </section>
        </aside>
      </div>
    </main>
  );
}
