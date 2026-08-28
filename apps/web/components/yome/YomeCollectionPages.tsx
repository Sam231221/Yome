"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Check, Headphones, MessageCircle, MoreHorizontal, Plus, Search, Share2, UsersRound } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { Avatar, Badge } from "@/components/yome/YomeUI";
import { groups, onboardingGoals, onboardingInterests, type YomeTone } from "@/lib/yome/data";

type DiscoveryGroup = {
  id: string;
  title: string;
  members: string;
  detail: string;
  symbol: string;
  tone: YomeTone;
  tags: string[];
};

const discoveryGroups: DiscoveryGroup[] = [
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

function GroupCard({ group }: { group: DiscoveryGroup }) {
  const [joined, setJoined] = useState(group.id === "robotics-team");

  return (
    <article className="discovery-group card">
      <Link className={`group-cover ${group.tone}`} href={`/groups/${group.id}`}>
        <span>{group.symbol}</span>
        <i />
        <i />
        <i />
      </Link>
      <div className="discovery-group-body">
        <div className="group-title-row">
          <div>
            <Link className="group-title-link" href={`/groups/${group.id}`}>
              {group.title}
            </Link>
            <small>{group.members} · Active today</small>
          </div>
          <button
            className={joined ? "secondary-button joined" : "primary-button"}
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
          <div className="stacked-avatars">
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

function QuestionCard() {
  const [helpful, setHelpful] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <article className="post card question-post">
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
        <button className="more-button" aria-label="Post options">
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
      <footer className="post-actions">
        <button className={helpful ? "post-action active" : "post-action"} onClick={() => setHelpful((v) => !v)}>
          <Check size={17} />
          <span>Helpful</span>
        </button>
        <button className="post-action">
          <MessageCircle size={17} />
          <span>Answer</span>
        </button>
        <button className="post-action">
          <Share2 size={17} />
          <span>Share</span>
        </button>
        <button className={saved ? "post-action active" : "post-action"} onClick={() => setSaved((v) => !v)}>
          <Bookmark size={17} />
          <span>Save</span>
        </button>
      </footer>
    </article>
  );
}

function MembersGrid() {
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
        <article className="member-card card" key={person.name}>
          <Avatar initials={person.initials} tone={person.tone} size="lg" />
          <h3>{person.name}</h3>
          <p>{person.role}</p>
          <span>3 shared groups</span>
          <button className="secondary-button">View profile</button>
        </article>
      ))}
    </div>
  );
}

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
    <main className="discover-page">
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
          <div className="discover-section-title">
            <div>
              <h2>Trending now</h2>
              <p>Topics learners are discussing today</p>
            </div>
            <button>View all <ArrowRight size={14} /></button>
          </div>
          <div>
            {trending.map((topic, index) => (
              <article className="topic-card card" key={topic.name}>
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
        <div className="discover-section-title">
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
          <div className="no-results card">
            <Search size={27} />
            <h3>No communities found</h3>
            <p>Try a broader STEM topic or clear your search.</p>
            <button onClick={() => setQuery("")}>Clear search</button>
          </div>
        ) : null}
      </section>
      {!query ? (
        <section className="explore-lower">
          <article className="popular-question card">
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
          <article className="learning-path card">
            <div className="section-kicker blue">Learning path</div>
            <h2>Start building with Python</h2>
            <p>A community-curated path from fundamentals to your first useful project.</p>
            <div className="path-steps">
              <span className="done">✓</span><i /><span>2</span><i /><span>3</span><i /><span>4</span>
            </div>
            <button className="primary-button">Continue path</button>
          </article>
        </section>
      ) : null}
    </main>
  );
}

export function GroupsContent() {
  const [tab, setTab] = useState("Discover");

  return (
    <main className="groups-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Communities</p>
          <h1>Learn better together</h1>
          <span>Find a focused group or create a space for your community.</span>
        </div>
        <button className="primary-button"><Plus size={17} /> Create group</button>
      </header>
      <nav className="page-tabs">
        {["Discover", "Your groups", "Invitations"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
            {item === "Invitations" ? <em>2</em> : null}
          </button>
        ))}
      </nav>
      {tab === "Discover" ? (
        <>
          <section className="group-feature card">
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
              <Link className="primary-button" href="/groups/robotics-team">
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
        <div className="groups-tab-state card">
          <div className="empty-icon"><UsersRound size={30} /></div>
          <h2>{tab}</h2>
          <p>{tab === "Your groups" ? "Your Python, Physics, and Robotics communities will appear here." : "You have two invitations ready to review."}</p>
          <button className="primary-button">{tab === "Your groups" ? "Explore groups" : "Review invitations"}</button>
        </div>
      )}
    </main>
  );
}

export function GroupDetailContent({ id }: { id: string }) {
  const [tab, setTab] = useState("Discussion");
  const [joined, setJoined] = useState(true);
  const group = groups.find((item) => item.id === id) ?? groups[2] ?? groups[0];
  const tabs = ["Discussion", "Questions", "Resources", "Members", "Events", "About"];

  return (
    <main className="group-detail-page">
      <Link className="back-link" href="/groups">← All groups</Link>
      <section className="group-detail-hero card">
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
          <div className="group-detail-actions">
            <button className={joined ? "secondary-button" : "primary-button"} onClick={() => setJoined((v) => !v)}>
              {joined ? <>Joined</> : "Join group"}
            </button>
            <Link className="secondary-button" href="/chat">
              <MessageCircle size={16} /> Group chat
            </Link>
            <button className="icon-button"><MoreHorizontal size={18} /></button>
          </div>
        </div>
        <p className="group-description">
          A collaborative community for learners building robots, electronics, and
          intelligent machines from first Arduino projects to advanced autonomous systems.
        </p>
        <div className="group-chips">
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
              <article className="group-announcement card">
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
                <button className="primary-button">Ask a question</button>
              </div>
              <QuestionCard />
            </>
          ) : null}
          {tab === "Resources" ? (
            <div className="resource-grid">
              <article className="resource-item card">
                <span className="resource-type pdf">PDF</span>
                <Badge tone="amber">Beginner</Badge>
                <h3>Arduino sensor starter guide</h3>
                <p>Wiring patterns, calibration tips, and example code.</p>
                <footer><span>Dr. Rivera · 2.1k saves</span><button><Bookmark size={16} /></button></footer>
              </article>
              <article className="resource-item card">
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
              <article className="card">
                <div className="date-tile"><strong>30</strong><span>AUG</span></div>
                <div><Badge tone="blue">Live workshop</Badge><h3>Build challenge mentor session</h3><p>Saturday · 2:30 PM · Video study room</p></div>
                <button className="primary-button">Join event</button>
              </article>
              <article className="card">
                <div className="date-tile amber"><strong>04</strong><span>SEP</span></div>
                <div><Badge tone="amber">Project review</Badge><h3>Prototype feedback circle</h3><p>Thursday · 5:00 PM · Group room</p></div>
                <button className="secondary-button">Interested</button>
              </article>
            </div>
          ) : null}
          {tab === "About" ? (
            <div className="group-about card">
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
          <section className="card group-side-card">
            <h3>About</h3>
            <div><span>Privacy</span><strong>Public group</strong></div>
            <div><span>Created</span><strong>March 2023</strong></div>
            <div><span>Location</span><strong>Global</strong></div>
            <button>Read group rules</button>
          </section>
          <section className="card group-side-card">
            <div className="section-title"><h3>Group moderators</h3><button>View all</button></div>
            <div className="moderator"><Avatar initials="DR" tone="blue" /><span><strong>Dr. Elena Rivera</strong><small>Educator · Owner</small></span></div>
            <div className="moderator"><Avatar initials="AN" tone="amber" /><span><strong>Alex Nguyen</strong><small>Moderator</small></span></div>
          </section>
          <section className="card group-side-card">
            <h3>Active study room</h3>
            <div className="active-group-room"><span className="live-dot" /><div><strong>Build challenge help</strong><small>18 studying now</small></div></div>
            <button className="join-room-wide"><Headphones size={16} /> Join room</button>
          </section>
        </aside>
      </div>
    </main>
  );
}

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
    <main className="connections-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Your network</p>
          <h1>Connections</h1>
          <span>Build an academic network around shared interests and useful collaboration.</span>
        </div>
        <button className="secondary-button"><Search size={17} /> Find people</button>
      </header>
      <div className="connection-summary">
        <article className="card"><strong>186</strong><span>Connections</span></article>
        <article className="card"><strong>12</strong><span>Pending requests</span></article>
        <article className="card"><strong>34</strong><span>People you follow</span></article>
        <article className="card"><strong>8</strong><span>Shared communities</span></article>
      </div>
      <nav className="page-tabs connection-tabs">
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
              <article className="connection-card card" key={person.name}>
                <div className="connection-cover"><div className="cover-grid" /></div>
                <Avatar initials={person.initials} tone={person.tone} size="lg" />
                <button className="more-button"><MoreHorizontal size={18} /></button>
                <h3>{person.name}</h3>
                <p>{person.role}</p>
                <small>{person.shared}</small>
                <div className="connection-tags"><Badge tone={person.tone}>Shared interests</Badge></div>
                <footer>
                  {state === "sent" ? (
                    <button className="secondary-button sent" onClick={() => setStates((curr) => ({ ...curr, [person.name]: null }))}>
                      <Check size={15} /> Request sent
                    </button>
                  ) : (
                    <button className="primary-button" onClick={() => setStates((curr) => ({ ...curr, [person.name]: "sent" }))}>
                      <Plus size={15} /> Connect
                    </button>
                  )}
                  <Link className="secondary-button" href="/chat"><MessageCircle size={15} /></Link>
                </footer>
              </article>
            );
          })}
        </div>
      ) : null}
      {tab === "Requests" ? (
        <div className="requests-list card">
          {people.slice(0, 3).map((person) => (
            <article key={person.name}>
              <Avatar initials={person.initials} tone={person.tone} />
              <div>
                <strong>{person.name}</strong>
                <p>{person.role}</p>
                <small>{person.shared}</small>
              </div>
              <button className="primary-button">Accept</button>
              <button className="secondary-button">Decline</button>
            </article>
          ))}
        </div>
      ) : null}
      {tab !== "Suggestions" && tab !== "Requests" ? (
        <div className="connection-list card">
          {people.map((person) => (
            <article key={person.name}>
              <Avatar initials={person.initials} tone={person.tone} />
              <div>
                <strong>{person.name}</strong>
                <p>{person.role}</p>
              </div>
              <Badge tone="neutral">Connected</Badge>
              <Link className="secondary-button" href="/chat"><MessageCircle size={15} /> Message</Link>
              <button className="more-button"><MoreHorizontal size={18} /></button>
            </article>
          ))}
        </div>
      ) : null}
    </main>
  );
}

export function StudyRoomsContent() {
  return (
    <div className="yome-page">
      <div className="yome-page-heading">
        <div>
          <p>Study Rooms</p>
          <h1>Focused rooms for live learning</h1>
          <span>Join active rooms or schedule quiet study blocks with your communities.</span>
        </div>
      </div>
      <div className="yome-grid">
        {["Python Help Room", "Physics Problem Solving", "Calculus Revision"].map((title, index) => (
          <article key={title} className="yome-card yome-section">
            <h2 className="yome-card-title">{title}</h2>
            <p className="yome-card-copy">{index + 6} learners studying now.</p>
            <button className="yome-button-primary mt-4">Join room</button>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ResourcesContent() {
  return (
    <div className="yome-page">
      <div className="yome-page-heading">
        <div>
          <p>Resources</p>
          <h1>A library shaped by useful explanations</h1>
          <span>Guides, notes, and examples saved by the Yome community.</span>
        </div>
      </div>
      <div className="yome-grid">
        {[...groups.slice(0, 1), ...groups.slice(1, 3)].map((item, index) => (
          <article key={item.id} className="yome-card yome-section">
            <Badge tone={index === 0 ? "violet" : index === 1 ? "blue" : "amber"}>Guide</Badge>
            <h2 className="yome-card-title mt-3">{item.name} Starter Notes</h2>
            <p className="yome-card-copy">{item.about}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ResourceDetailContent({ id }: { id: string }) {
  return (
    <div className="yome-page yome-page-narrow">
      <Link className="yome-button-secondary mb-4" href="/resources">
        Back to resources
      </Link>
      <article className="yome-card yome-section">
        <Badge tone="violet">Resource</Badge>
        <h1 className="mt-5 text-3xl font-black tracking-[-1px] text-[var(--yome-navy)]">{id}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--yome-muted)]">Detailed resource content remains available for the next pass.</p>
      </article>
    </div>
  );
}

export function ProjectsContent() {
  return (
    <div className="yome-page">
      <div className="yome-page-heading">
        <div>
          <p>Projects</p>
          <h1>Learn by building in public</h1>
          <span>Share progress, find collaborators, and collect helpful feedback.</span>
        </div>
      </div>
      <div className="yome-grid">
        {discoveryGroups.slice(0, 3).map((group) => (
          <article key={group.id} className="yome-card yome-section">
            <Badge tone={group.tone}>{group.title}</Badge>
            <h2 className="yome-card-title mt-3">{group.detail}</h2>
            <p className="yome-card-copy">Project details stay wired in the existing routes.</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailContent({ id }: { id: string }) {
  return (
    <div className="yome-page yome-page-narrow">
      <Link className="yome-button-secondary mb-4" href="/projects">
        Back to projects
      </Link>
      <article className="yome-card yome-section">
        <Badge tone="amber">Project</Badge>
        <h1 className="mt-5 text-3xl font-black tracking-[-1px] text-[var(--yome-navy)]">{id}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--yome-muted)]">Project detail redesign is preserved and will be tightened in a follow-up pass.</p>
      </article>
    </div>
  );
}

export function EventsContent() {
  return (
    <div className="yome-page">
      <div className="yome-page-heading">
        <div>
          <p>Events</p>
          <h1>Learning sessions worth showing up for</h1>
          <span>Follow revision sessions, workshops, demos, and community events.</span>
        </div>
      </div>
      <div className="yome-list">
        {[
          { day: "28", month: "AUG", title: "Calculus Revision Session" },
          { day: "30", month: "AUG", title: "Intro to Machine Learning" },
        ].map((event) => (
          <article key={event.title} className="yome-card yome-section grid gap-4 md:grid-cols-[70px_1fr_auto] md:items-center">
            <div className="date-tile"><strong>{event.day}</strong><span>{event.month}</span></div>
            <div><h2 className="yome-card-title mb-1">{event.title}</h2><p className="yome-card-copy">Upcoming community event</p></div>
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
      <div className="yome-page-heading">
        <div>
          <p>Notifications</p>
          <h1>What needs your attention</h1>
          <span>Learning updates, invitations, and accepted answers.</span>
        </div>
      </div>
      <div className="yome-list">
        {["Answer accepted", "Python Help Room is live", "New project invite"].map((title) => (
          <article key={title} className="yome-card yome-section">
            <h2 className="yome-card-title">{title}</h2>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SettingsContent() {
  return (
    <div className="yome-page">
      <div className="yome-page-heading">
        <div>
          <p>Settings</p>
          <h1>Shape your Yome experience</h1>
          <span>Profile controls, privacy preferences, notifications, and safety.</span>
        </div>
      </div>
      <div className="yome-card yome-section">
        <p className="yome-card-copy">Settings content remains available and can be brought over to the exact reference layout next.</p>
      </div>
    </div>
  );
}

export function OnboardingReferencePage({
  values,
  step,
  setStep,
  setValues,
  finish,
}: {
  values: {
    username: string;
    educationLevel: string;
    bio: string;
    interests: string[];
    topics: string[];
    goals: string[];
  };
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  setValues: Dispatch<SetStateAction<{
    username: string;
    educationLevel: string;
    bio: string;
    interests: string[];
    topics: string[];
    goals: string[];
  }>>;
  finish: () => void;
}) {
  const toggle = (key: "interests" | "topics" | "goals", value: string) =>
    setValues((current) => {
      const list = current[key];
      return { ...current, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });

  const goalIcons = ["↗", "◎", "?", "◇", "○", "✦"];

  return (
    <div className="onboarding-shell">
      <header className="onboarding-top">
        <Link className="auth-brand" href="/dashboard">
          <span className="brand-mark">Y</span>
          <span>yome</span>
        </Link>
        <span>Step {step} of 3</span>
        <button onClick={finish}>Save & exit</button>
      </header>
      <div className="progress-track"><i style={{ width: `${(step / 3) * 100}%` }} /></div>
      <main className="onboarding-main">
        {step === 1 ? (
          <>
            <p className="eyebrow">Build your academic identity</p>
            <h1>Tell us about yourself</h1>
            <p className="onboarding-lead">This helps Yome personalize your learning network.</p>
            <div className="avatar-picker">
              <Avatar initials="MP" tone="violet" size="lg" />
              <button><Plus size={16} /> Add profile image</button>
            </div>
            <div className="profile-fields">
              <label>
                <span>Username</span>
                <div className="prefix-field">
                  <b>@</b>
                  <input value={values.username} onChange={(event) => setValues((current) => ({ ...current, username: event.target.value }))} placeholder="mayacodes" />
                </div>
              </label>
              <label>
                <span>Education level</span>
                <select value={values.educationLevel} onChange={(event) => setValues((current) => ({ ...current, educationLevel: event.target.value }))}>
                  <option value="secondary">Secondary school</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="postgraduate">Postgraduate</option>
                  <option value="educator">Educator</option>
                  <option value="other">Independent learner</option>
                </select>
              </label>
              <label className="wide">
                <span>Short biography</span>
                <textarea value={values.bio} onChange={(event) => setValues((current) => ({ ...current, bio: event.target.value }))} placeholder="Computer Science student exploring AI, robotics, and human-centered technology." />
                <small>Help others understand what you&apos;re learning.</small>
              </label>
            </div>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <p className="eyebrow">Make Yome yours</p>
            <h1>What interests you?</h1>
            <p className="onboarding-lead">Select at least two areas. You can refine your topics later.</p>
            <div className="interest-grid">
              {onboardingInterests.map((item) => {
                const active = values.interests.includes(item.name);
                return (
                  <button key={item.name} className={`${item.tone} ${active ? "selected" : ""}`} onClick={() => toggle("interests", item.name)}>
                    <span className="interest-symbol">{item.symbol}</span>
                    <span><strong>{item.name}</strong><small>{item.detail}</small></span>
                    <i>{active ? "✓" : "+"}</i>
                  </button>
                );
              })}
            </div>
            <div className="topic-picks">
              <span>Suggested topics</span>
              <div>
                {["Artificial Intelligence", "Python", "Robotics", "Data Science", "Calculus", "Cybersecurity"].map((topic) => (
                  <button key={topic} onClick={() => toggle("topics", topic)}>
                    {values.topics.includes(topic) ? "✓" : "+"} {topic}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <p className="eyebrow">Your learning journey</p>
            <h1>What brings you to Yome?</h1>
            <p className="onboarding-lead">Choose as many as you like.</p>
            <div className="goal-list">
              {onboardingGoals.map((goal, index) => (
                <button key={goal} className={values.goals.includes(goal) ? "selected" : ""} onClick={() => toggle("goals", goal)}>
                  <span>{goalIcons[index]}</span>
                  <strong>{goal}</strong>
                  <i>{values.goals.includes(goal) ? "✓" : "+"}</i>
                </button>
              ))}
            </div>
            <div className="onboarding-note">
              <UsersRound size={20} />
              <p>
                <strong>Your network starts with shared curiosity.</strong>
                <br />
                We&apos;ll recommend people and groups based on these choices, not popularity.
              </p>
            </div>
          </>
        ) : null}
        <footer className="onboarding-actions">
          <button className="secondary-button" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>Back</button>
          <span>{[1, 2, 3].map((item) => <i key={item} className={step === item ? "active" : ""} />)}</span>
          <button className="primary-button" onClick={() => (step === 3 ? finish() : setStep((current) => current + 1))}>
            {step === 3 ? "Finish setup" : "Continue"} <ArrowRight size={16} />
          </button>
        </footer>
      </main>
    </div>
  );
}
