import Link from "next/link";
import { ArrowRight, CalendarPlus, Check, MessageCircle, Plus } from "lucide-react";
import { Avatar, Badge, PageHeading, ToneSymbol } from "@/components/yome/YomeUI";
import { connections, events, groups, notifications, projects, resources, studyRooms, topics } from "@/lib/yome/data";

export function ExploreContent() {
  return (
    <div className="yome-page">
      <PageHeading eyebrow="Explore Yome" title="Discover topics, people, and communities" subtitle="Find learning spaces shaped around useful questions and shared work." />
      <div className="yome-card yome-section mb-6">
        <label className="yome-searchbox">
          <span>Search</span>
          <input placeholder="Search artificial intelligence, calculus, robotics..." />
        </label>
      </div>
      <section className="yome-grid">
        {topics.map((topic, index) => (
          <article key={topic.title} className="yome-card yome-section">
            <div className="flex items-start justify-between">
              <ToneSymbol tone={topic.tone}>{String(index + 1).padStart(2, "0")}</ToneSymbol>
              <span className="text-2xl font-black text-[var(--yome-border)]">#{index + 1}</span>
            </div>
            <h2 className="yome-card-title mt-5">{topic.title}</h2>
            <p className="yome-card-copy">{topic.posts} from learners asking, explaining, and building.</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export function GroupsContent() {
  return (
    <div className="yome-page">
      <PageHeading eyebrow="Communities" title="Groups built around curiosity" subtitle="Join focused communities for questions, resources, study rooms, and projects." action={<Link className="yome-button-primary" href="/groups/python-learners"><Plus size={17} /> New group</Link>} />
      <div className="yome-grid">
        {groups.map((group) => (
          <Link key={group.id} href={`/groups/${group.id}`} className="yome-card yome-section block no-underline">
            <ToneSymbol tone={group.tone}>{group.symbol}</ToneSymbol>
            <h2 className="yome-card-title mt-5">{group.name}</h2>
            <p className="yome-card-copy">{group.about}</p>
            <div className="mt-5 flex items-center justify-between">
              <Badge tone={group.tone}>{group.members} learners</Badge>
              <span className="text-[10px] font-bold text-[var(--yome-blue)]">{group.joined ? "Joined" : "Join"}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function GroupDetailContent({ id }: { id: string }) {
  const group = groups.find((item) => item.id === id) ?? groups[0];
  return (
    <div className="yome-page">
      <section className="yome-card overflow-hidden">
        <div className="yome-visual min-h-[220px] rounded-none">
          <div className="yome-visual-grid" />
          <div className="relative z-[1] p-8 text-white">
            <ToneSymbol tone={group.tone}>{group.symbol}</ToneSymbol>
            <h1 className="mt-6 text-4xl font-black tracking-[-1.4px]">{group.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">{group.about}</p>
          </div>
        </div>
        <div className="grid gap-5 p-6 md:grid-cols-[1fr_280px]">
          <main>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge tone={group.tone}>{group.members} learners</Badge>
              <Badge tone="neutral">{group.level}</Badge>
              <Badge tone="teal">Live study rooms</Badge>
            </div>
            <h2 className="yome-card-title">Recent group activity</h2>
            <div className="yome-list">
              {["Shared a new resource on visual proofs.", "Scheduled a focused revision room.", "Asked for feedback on a project build."].map((item) => (
                <article key={item} className="rounded-xl bg-[var(--yome-surface-2)] p-4 text-sm">{item}</article>
              ))}
            </div>
          </main>
          <aside className="yome-list">
            <Link className="yome-button-primary" href="/chat"><MessageCircle size={17} /> Open group chat</Link>
            <Link className="yome-button-secondary" href="/study-rooms">Join study room</Link>
          </aside>
        </div>
      </section>
    </div>
  );
}

export function ConnectionsContent() {
  return (
    <div className="yome-page">
      <PageHeading eyebrow="Connections" title="People to learn with" subtitle="Find students and educators with overlapping subjects and goals." />
      <div className="yome-grid">
        {connections.map((person) => (
          <article key={person.name} className="yome-card yome-section">
            <div className="flex items-center gap-3">
              <Avatar initials={person.initials} tone={person.tone} />
              <div>
                <h2 className="m-0 text-[14px] font-bold text-[var(--yome-navy)]">{person.name}</h2>
                <p className="m-0 text-[11px] text-[var(--yome-muted)]">{person.detail}</p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button className="yome-button-primary min-h-9 flex-1"><Plus size={15} /> Connect</button>
              <Link className="yome-button-secondary min-h-9" href="/chat"><MessageCircle size={15} /></Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function StudyRoomsContent() {
  return (
    <div className="yome-page">
      <PageHeading eyebrow="Study Rooms" title="Focused rooms for live learning" subtitle="Join active rooms or schedule quiet study blocks with your communities." action={<button className="yome-button-primary"><CalendarPlus size={17} /> Schedule room</button>} />
      <div className="yome-grid">
        {studyRooms.map((room) => (
          <article key={room.id} className="yome-card yome-section">
            <div className="flex items-center gap-3">
              <ToneSymbol tone={room.tone}>{room.symbol}</ToneSymbol>
              <div>
                <h2 className="yome-card-title mb-0">{room.title}</h2>
                <p className="m-0 text-[11px] text-green-600">{room.meta}</p>
              </div>
            </div>
            <div className="mt-5 flex -space-x-2">
              <Avatar initials="AL" tone="blue" size="sm" />
              <Avatar initials="SC" tone="teal" size="sm" />
              <Avatar initials="MP" tone="violet" size="sm" />
            </div>
            <button className="yome-button-primary mt-5 w-full">Join room</button>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ResourcesContent() {
  return (
    <div className="yome-page">
      <PageHeading eyebrow="Resources" title="A library shaped by useful explanations" subtitle="Guides, checklists, workbooks, and examples saved by the Yome community." />
      <div className="yome-grid">
        {resources.map((resource) => (
          <Link key={resource.id} href={`/resources/${resource.id}`} className="yome-card yome-section block no-underline">
            <ToneSymbol tone={resource.tone}>{resource.type}</ToneSymbol>
            <h2 className="yome-card-title mt-5">{resource.title}</h2>
            <p className="yome-card-copy">{resource.summary}</p>
            <div className="mt-5 flex items-center justify-between">
              <Badge tone={resource.tone}>{resource.subject}</Badge>
              <span className="text-[10px] text-[var(--yome-muted)]">{resource.saves}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ResourceDetailContent({ id }: { id: string }) {
  const resource = resources.find((item) => item.id === id) ?? resources[0];
  return (
    <div className="yome-page yome-page-narrow">
      <Link className="yome-button-secondary mb-4" href="/resources">Back to resources</Link>
      <article className="yome-card yome-section">
        <ToneSymbol tone={resource.tone}>{resource.type}</ToneSymbol>
        <h1 className="mt-5 text-3xl font-black tracking-[-1px] text-[var(--yome-navy)]">{resource.title}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--yome-muted)]">{resource.summary}</p>
        <div className="yome-visual mt-6">
          <div className="yome-visual-grid" />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge tone={resource.tone}>{resource.subject}</Badge>
          <Badge tone="neutral">{resource.saves}</Badge>
        </div>
      </article>
    </div>
  );
}

export function ProjectsContent() {
  return (
    <div className="yome-page">
      <PageHeading eyebrow="Projects" title="Learn by building in public" subtitle="Share progress, find collaborators, and collect helpful feedback." />
      <div className="yome-grid">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className="yome-card yome-section block no-underline">
            <div className="yome-visual mb-5 min-h-[140px]"><div className="yome-visual-grid" /></div>
            <Badge tone={project.tone}>{project.subject}</Badge>
            <h2 className="yome-card-title mt-3">{project.title}</h2>
            <p className="yome-card-copy">{project.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailContent({ id }: { id: string }) {
  const project = projects.find((item) => item.id === id) ?? projects[0];
  return (
    <div className="yome-page">
      <Link className="yome-button-secondary mb-4" href="/projects">Back to projects</Link>
      <section className="yome-card yome-section">
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div>
            <Badge tone={project.tone}>{project.subject}</Badge>
            <h1 className="mt-4 text-4xl font-black tracking-[-1.4px] text-[var(--yome-navy)]">{project.title}</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--yome-muted)]">{project.summary}</p>
          </div>
          <div className="yome-visual min-h-[220px]"><div className="yome-visual-grid" /></div>
        </div>
        <div className="yome-grid mt-6">
          <div className="rounded-xl bg-[var(--yome-surface-2)] p-4"><span className="yome-muted">Team</span><strong className="block">{project.team}</strong></div>
          <div className="rounded-xl bg-[var(--yome-surface-2)] p-4"><span className="yome-muted">Progress</span><strong className="block">{project.progress}</strong></div>
          <div className="rounded-xl bg-[var(--yome-surface-2)] p-4"><span className="yome-muted">Stack</span><strong className="block">{project.stack}</strong></div>
        </div>
      </section>
    </div>
  );
}

export function EventsContent() {
  return (
    <div className="yome-page">
      <PageHeading eyebrow="Events" title="Learning sessions worth showing up for" subtitle="Follow revision sessions, workshops, demos, and community events." />
      <div className="yome-list">
        {events.map((event) => (
          <article key={event.id} className="yome-card yome-section grid gap-4 md:grid-cols-[70px_1fr_auto] md:items-center">
            <ToneSymbol tone={event.tone}><span className="grid text-center"><strong>{event.day}</strong><small>{event.month}</small></span></ToneSymbol>
            <div>
              <h2 className="yome-card-title mb-1">{event.title}</h2>
              <p className="yome-card-copy">{event.meta} · {event.group}</p>
            </div>
            <button className="yome-button-secondary">Add to calendar</button>
          </article>
        ))}
      </div>
    </div>
  );
}

export function NotificationsContent() {
  return (
    <div className="yome-page yome-page-narrow">
      <PageHeading eyebrow="Notifications" title="What needs your attention" subtitle="Learning updates, invitations, reports, and accepted answers." />
      <div className="yome-list">
        {notifications.map((notification) => (
          <article key={notification.id} className="yome-card yome-section flex items-start gap-3">
            <ToneSymbol tone={notification.tone}><Check size={17} /></ToneSymbol>
            <div className="min-w-0 flex-1">
              <h2 className="yome-card-title mb-1">{notification.title}</h2>
              <p className="yome-card-copy">{notification.body}</p>
              <small className="mt-2 block text-[10px] text-[var(--yome-muted)]">{notification.time}</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SettingsContent() {
  return (
    <div className="yome-page">
      <PageHeading eyebrow="Settings" title="Shape your Yome experience" subtitle="Profile controls, privacy preferences, notifications, and community safety." />
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <aside className="yome-card yome-section yome-list">
          {["Account", "Privacy", "Notifications", "Safety", "Appearance"].map((item, index) => (
            <button key={item} className={index === 0 ? "yome-nav-item active" : "yome-nav-item"}>{item}</button>
          ))}
        </aside>
        <main className="yome-list">
          <section className="yome-card yome-section">
            <div className="yome-section-title">
              <h2>Learning profile</h2>
              <Badge tone="blue">Frontend v1</Badge>
            </div>
            <div className="yome-two-grid">
              <label className="yome-form">
                <span>Education level</span>
                <select className="yome-select" defaultValue="undergraduate">
                  <option value="secondary">Secondary school</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="postgraduate">Postgraduate</option>
                  <option value="educator">Educator</option>
                  <option value="independent">Independent learner</option>
                </select>
              </label>
              <label className="yome-form">
                <span>Contact requests</span>
                <select className="yome-select" defaultValue="shared">
                  <option value="shared">People with shared groups</option>
                  <option value="everyone">Everyone on Yome</option>
                  <option value="none">No new requests</option>
                </select>
              </label>
            </div>
          </section>
          <section className="yome-card yome-section">
            <div className="yome-section-title">
              <h2>Safety checkup</h2>
              <Badge tone="teal">Recommended</Badge>
            </div>
            <p className="yome-card-copy">Reports, blocks, message controls, and group moderation settings are represented in the UI now and should be backed by persisted APIs in the next backend phase.</p>
          </section>
        </main>
      </div>
    </div>
  );
}
