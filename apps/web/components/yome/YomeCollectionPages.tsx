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
  const [filter, setFilter] = useState("All rooms");
  const [openRoom, setOpenRoom] = useState(false);
  const rooms = [
    {
      id: "calculus-revision-room",
      title: "Calculus Revision Room",
      topic: "Mathematics · Calculus",
      description: "Integration techniques, exam practice, and a shared focus timer.",
      symbol: "Σ",
      tone: "violet" as YomeTone,
      active: 8,
    },
    {
      id: "python-help-room",
      title: "Python Help Room",
      topic: "Technology · Programming",
      description: "Debug together, compare approaches, and unblock tricky exercises.",
      symbol: "</>",
      tone: "blue" as YomeTone,
      active: 14,
    },
    {
      id: "physics-problem-solving",
      title: "Physics Problem Solving",
      topic: "Science · Physics",
      description: "Work first-principles questions with voice, chat, and screen share.",
      symbol: "φ",
      tone: "teal" as YomeTone,
      active: 7,
    },
    {
      id: "arduino-build-clinic",
      title: "Arduino Build Clinic",
      topic: "Engineering · Electronics",
      description: "Bring wiring questions, sensor issues, and prototype feedback.",
      symbol: "⚙",
      tone: "amber" as YomeTone,
      active: 11,
    },
  ];
  const visibleRooms = rooms.filter((room) => filter === "All rooms" || room.topic.startsWith(filter));

  if (openRoom) {
    return <StudyRoomDetail onLeave={() => setOpenRoom(false)} />;
  }

  return (
    <main className="study-rooms-page">
      <header className="study-heading">
        <div>
          <p className="eyebrow">Live collaboration</p>
          <h1>Study Rooms</h1>
          <span>Focused spaces to study, ask questions, and work alongside other learners.</span>
        </div>
        <button className="primary-button">
          <Plus size={17} /> Create room
        </button>
      </header>

      <section className="study-feature card">
        <div className="study-feature-copy">
          <div className="live-badge">
            <span className="live-dot" /> Live now
          </div>
          <Badge tone="violet">Mathematics · Calculus</Badge>
          <h2>Calculus Revision Room</h2>
          <p>Integration techniques, exam practice, and a shared focus timer. Join with audio, video, or chat only.</p>
          <div className="feature-participants">
            <div className="proof-avatars">
              <Avatar initials="SC" tone="teal" />
              <Avatar initials="MP" tone="violet" />
              <Avatar initials="JL" tone="blue" />
              <Avatar initials="AN" tone="amber" />
            </div>
            <span>
              <strong>8 studying now</strong>
              <small>Hosted by Sarah Chen</small>
            </span>
          </div>
          <div className="feature-room-actions">
            <button className="primary-button" onClick={() => setOpenRoom(true)}>
              <Headphones size={17} /> Join room
            </button>
            <button className="secondary-button">
              <Phone size={16} /> Preview incoming call
            </button>
          </div>
        </div>
        <div className="focus-timer">
          <div className="timer-ring">
            <span>24:18</span>
            <small>FOCUS</small>
          </div>
          <div className="timer-marks">
            {Array.from({ length: 20 }).map((_, index) => (
              <i key={index} style={{ transform: `rotate(${index * 18}deg)` }} />
            ))}
          </div>
          <p>Shared Pomodoro timer</p>
        </div>
      </section>

      <div className="room-toolbar">
        <nav>
          {["All rooms", "Science", "Technology", "Engineering", "Mathematics"].map((item) => (
            <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </nav>
        <label>
          <Search size={16} />
          <input placeholder="Find a room..." />
        </label>
      </div>

      <section className="rooms-grid">
        {visibleRooms.map((room) => (
          <article className="study-room-card card" key={room.id}>
            <header>
              <div className={`study-room-symbol ${room.tone}`}>{room.symbol}</div>
              <span className="live-badge">
                <i className="live-dot" /> Live
              </span>
              <button className="more-button">
                <MoreHorizontal size={18} />
              </button>
            </header>
            <Badge tone={room.tone}>{room.topic.split(" · ")[0]}</Badge>
            <h3>{room.title}</h3>
            <p>{room.description}</p>
            <div className="room-features">
              <span><Mic size={13} /> Audio</span>
              <span><MessageCircle size={13} /> Chat</span>
              <span><MonitorUp size={13} /> Share</span>
            </div>
            <footer>
              <div>
                <div className="stacked-avatars">
                  <Avatar initials="SC" tone="teal" size="xs" />
                  <Avatar initials="AN" tone="amber" size="xs" />
                  <Avatar initials="MP" tone="violet" size="xs" />
                </div>
                <span>{room.active} studying</span>
              </div>
              <button onClick={() => setOpenRoom(true)}>
                Join <ArrowRight size={14} />
              </button>
            </footer>
          </article>
        ))}
      </section>

      <section className="scheduled-rooms">
        <div className="discover-section-title">
          <div>
            <h2>Scheduled sessions</h2>
            <p>Plan ahead and get a reminder before rooms open.</p>
          </div>
          <button>
            View calendar <ArrowRight size={14} />
          </button>
        </div>
        <div>
          <article className="card">
            <div className="date-tile">
              <strong>30</strong>
              <span>AUG</span>
            </div>
            <div>
              <Badge tone="blue">Technology</Badge>
              <h3>Intro to machine learning</h3>
              <p>2:30 PM · 42 interested</p>
            </div>
            <button className="secondary-button">Set reminder</button>
          </article>
          <article className="card">
            <div className="date-tile amber">
              <strong>02</strong>
              <span>SEP</span>
            </div>
            <div>
              <Badge tone="amber">Engineering</Badge>
              <h3>Arduino build clinic</h3>
              <p>5:00 PM · 28 interested</p>
            </div>
            <button className="secondary-button">Set reminder</button>
          </article>
        </div>
      </section>
    </main>
  );
}

export function ResourcesContent() {
  const [subject, setSubject] = useState("All");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const resourcesData = [
    { id: "visual-guide-to-integration-techniques", title: "A visual guide to integration techniques", subject: "Mathematics", topic: "Calculus", level: "Undergraduate", type: "PDF", tone: "violet" as YomeTone, author: "Sarah Chen", saves: "2.4k", rating: "4.9", description: "Clear diagrams and worked examples for substitution, parts, and partial fractions." },
    { id: "python-data-structures-reference", title: "Python data structures reference", subject: "Technology", topic: "Programming", level: "Beginner", type: "GUIDE", tone: "blue" as YomeTone, author: "Maya Patel", saves: "1.8k", rating: "4.8", description: "A compact reference for lists, dictionaries, sets, tuples, and common patterns." },
    { id: "mechanics-problem-solving-workbook", title: "Mechanics problem-solving workbook", subject: "Science", topic: "Physics", level: "A Level", type: "PDF", tone: "teal" as YomeTone, author: "Leo Martins", saves: "980", rating: "4.7", description: "Practice questions with structured hints for forces, momentum, and energy." },
    { id: "arduino-sensor-examples", title: "Arduino sensor examples", subject: "Engineering", topic: "Electronics", level: "Beginner", type: "CODE", tone: "amber" as YomeTone, author: "Robotics Club", saves: "1.5k", rating: "4.9", description: "Reusable wiring diagrams and code examples for common environmental sensors." },
    { id: "neural-networks-from-first-principles", title: "Neural networks from first principles", subject: "Technology", topic: "AI", level: "Intermediate", type: "VIDEO", tone: "blue" as YomeTone, author: "Dr. James Liu", saves: "3.1k", rating: "4.9", description: "A concept-first lesson on layers, activations, gradients, and training." },
    { id: "biology-revision-maps", title: "Biology revision maps", subject: "Science", topic: "Biology", level: "GCSE", type: "NOTES", tone: "teal" as YomeTone, author: "Sofia Rossi", saves: "760", rating: "4.6", description: "Linked concept maps for cells, genetics, ecology, and human systems." },
  ];
  const visible = resourcesData.filter(
    (item) =>
      (subject === "All" || item.subject === subject) &&
      `${item.title} ${item.topic} ${item.author}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="resource-library-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Shared knowledge</p>
          <h1>Resource Library</h1>
          <span>Useful notes, guides, code, diagrams, and lessons organized for learning.</span>
        </div>
        <button className="primary-button">
          <Plus size={17} /> Share resource
        </button>
      </header>

      <section className="resource-search-hero">
        <div>
          <Search size={21} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guides, notes, subjects, or topics..." />
          <button>Search</button>
        </div>
        <p>
          Popular:
          <button onClick={() => setQuery("Python")}>Python</button>
          <button onClick={() => setQuery("Calculus")}>Calculus</button>
          <button onClick={() => setQuery("Arduino")}>Arduino</button>
          <button onClick={() => setQuery("AI")}>Artificial Intelligence</button>
        </p>
      </section>

      <div className="library-layout">
        <aside className="library-filters card">
          <div className="section-title">
            <h3>Filters</h3>
            <button onClick={() => { setSubject("All"); setQuery(""); }}>Clear</button>
          </div>
          <label>Subject</label>
          {["All", "Science", "Technology", "Engineering", "Mathematics"].map((item) => (
            <button key={item} className={subject === item ? "active" : ""} onClick={() => setSubject(item)}>
              <span className={`filter-dot ${item.toLowerCase()}`} />
              {item}
              <i>{item === "All" ? resourcesData.length : resourcesData.filter((resource) => resource.subject === item).length}</i>
            </button>
          ))}
          <label>Resource type</label>
          {["PDF & documents", "Videos", "Code repositories", "Study notes"].map((item) => (
            <button key={item}>
              <span /> {item}
            </button>
          ))}
          <label>Level</label>
          <select>
            <option>All levels</option>
            <option>GCSE</option>
            <option>A Level</option>
            <option>Undergraduate</option>
            <option>Postgraduate</option>
          </select>
        </aside>

        <section className="resource-results">
          <div className="results-heading">
            <div>
              <h2>{subject === "All" ? "Recommended resources" : subject}</h2>
              <p>{visible.length} useful resources</p>
            </div>
            <select>
              <option>Most helpful</option>
              <option>Most recent</option>
              <option>Most saved</option>
            </select>
          </div>

          <div className="resource-library-grid">
            {visible.map((item, index) => {
              const isSaved = saved.includes(item.id);
              return (
                <article className="library-resource-card card" key={item.id}>
                  <Link className={`resource-preview ${item.tone}`} href={`/resources/${item.id}`}>
                    <span className="resource-preview-type">{item.type}</span>
                    <div className="resource-preview-lines"><i /><i /><i /><i /></div>
                    <strong>{item.topic}</strong>
                  </Link>
                  <div className="library-resource-body">
                    <div className="resource-labels">
                      <Badge tone={item.tone}>{item.subject}</Badge>
                      <Badge tone="neutral">{item.level}</Badge>
                    </div>
                    <Link className="resource-title-link" href={`/resources/${item.id}`}>
                      {item.title}
                    </Link>
                    <p>{item.description}</p>
                    <div className="resource-author">
                      <Avatar initials={item.author.split(" ").map((name) => name[0]).join("").slice(0, 2)} tone={item.tone} size="xs" />
                      <span>
                        <strong>{item.author}</strong>
                        <small>Uploaded {index + 1}d ago</small>
                      </span>
                    </div>
                    <footer>
                      <span>★ {item.rating} · {item.saves} saves</span>
                      <button className={isSaved ? "saved" : ""} onClick={() => setSaved((current) => isSaved ? current.filter((value) => value !== item.id) : [...current, item.id])}>
                        <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                      </button>
                    </footer>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

export function ResourceDetailContent({ id }: { id: string }) {
  const [saved, setSaved] = useState(false);
  const [helpful, setHelpful] = useState(false);
  const resourcesData = [
    { id: "visual-guide-to-integration-techniques", title: "A visual guide to integration techniques", subject: "Mathematics", topic: "Calculus", level: "Undergraduate", type: "PDF", tone: "violet" as YomeTone, author: "Sarah Chen", saves: "2.4k", rating: "4.9", description: "Clear diagrams and worked examples for substitution, parts, and partial fractions." },
    { id: "python-data-structures-reference", title: "Python data structures reference", subject: "Technology", topic: "Programming", level: "Beginner", type: "GUIDE", tone: "blue" as YomeTone, author: "Maya Patel", saves: "1.8k", rating: "4.8", description: "A compact reference for lists, dictionaries, sets, tuples, and common patterns." },
    { id: "mechanics-problem-solving-workbook", title: "Mechanics problem-solving workbook", subject: "Science", topic: "Physics", level: "A Level", type: "PDF", tone: "teal" as YomeTone, author: "Leo Martins", saves: "980", rating: "4.7", description: "Practice questions with structured hints for forces, momentum, and energy." },
    { id: "arduino-sensor-examples", title: "Arduino sensor examples", subject: "Engineering", topic: "Electronics", level: "Beginner", type: "CODE", tone: "amber" as YomeTone, author: "Robotics Club", saves: "1.5k", rating: "4.9", description: "Reusable wiring diagrams and code examples for common environmental sensors." },
    { id: "neural-networks-from-first-principles", title: "Neural networks from first principles", subject: "Technology", topic: "AI", level: "Intermediate", type: "VIDEO", tone: "blue" as YomeTone, author: "Dr. James Liu", saves: "3.1k", rating: "4.9", description: "A concept-first lesson on layers, activations, gradients, and training." },
    { id: "biology-revision-maps", title: "Biology revision maps", subject: "Science", topic: "Biology", level: "GCSE", type: "NOTES", tone: "teal" as YomeTone, author: "Sofia Rossi", saves: "760", rating: "4.6", description: "Linked concept maps for cells, genetics, ecology, and human systems." },
  ];
  const resource = resourcesData.find((item) => item.id === id) ?? resourcesData[0];

  return (
    <main className="resource-detail-page">
      <Link className="back-link" href="/resources">← Resource Library</Link>
      <div className="resource-detail-layout">
        <section>
          <article className="resource-document card">
            <header>
              <div>
                <Badge tone={resource.tone}>{resource.subject}</Badge>
                <Badge tone="neutral">{resource.level}</Badge>
              </div>
              <span>{resource.type}</span>
            </header>
            <div className="document-page">
              <p>YOME LEARNING RESOURCE</p>
              <h1>{resource.title}</h1>
              <div className="document-rule" />
              <h3>Key idea</h3>
              <p>{resource.description}</p>
              <div className="document-diagram">
                <div className="diagram-axis"><i /><i /><i /></div>
                <span>concept</span>
                <span>example</span>
                <span>practice</span>
              </div>
              <h3>Learning objectives</h3>
              <ul>
                <li>Build an intuitive understanding of the core idea.</li>
                <li>Connect the concept to clear worked examples.</li>
                <li>Apply the method independently and check the result.</li>
              </ul>
            </div>
            <footer>
              <span>Preview page 1 of 18</span>
              <button className="primary-button">
                <FileText size={15} /> Open resource
              </button>
            </footer>
          </article>

          <article className="resource-discussion card">
            <h2>About this resource</h2>
            <p>{resource.description} This resource was reviewed by the community and tagged for clear explanations and practical examples.</p>
            <div className="resource-topics">
              <Badge tone={resource.tone}>{resource.topic}</Badge>
              <Badge tone="neutral">Visual learning</Badge>
              <Badge tone="neutral">Practice included</Badge>
            </div>
            <footer>
              <button className={helpful ? "active" : ""} onClick={() => setHelpful((value) => !value)}>
                <HelpCircle size={16} /> {helpful ? "Marked helpful" : "Was this helpful?"}
              </button>
              <button><Share2 size={16} /> Share</button>
              <button>Report</button>
            </footer>
          </article>
        </section>

        <aside>
          <section className="card resource-side">
            <div className="resource-side-author">
              <Avatar initials={resource.author.split(" ").map((name) => name[0]).join("").slice(0, 2)} tone={resource.tone} size="lg" />
              <div>
                <strong>{resource.author}</strong>
                <p>Helpful contributor</p>
              </div>
            </div>
            <button className="secondary-button">View profile</button>
          </section>

          <section className="card resource-side">
            <h3>Resource details</h3>
            <div><span>Format</span><strong>{resource.type}</strong></div>
            <div><span>Pages</span><strong>18</strong></div>
            <div><span>Uploaded</span><strong>3 days ago</strong></div>
            <div><span>Rating</span><strong>★ {resource.rating}</strong></div>
            <div><span>Saves</span><strong>{resource.saves}</strong></div>
            <button className={saved ? "secondary-button saved" : "primary-button"} onClick={() => setSaved((value) => !value)}>
              <Bookmark size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save resource"}
            </button>
          </section>

          <section className="card resource-side">
            <h3>Related resources</h3>
            <button className="related-resource">
              <span>PDF</span>
              <div><strong>Calculus formula reference</strong><small>1.1k saves</small></div>
            </button>
            <button className="related-resource">
              <span>VID</span>
              <div><strong>Integration walkthrough</strong><small>840 saves</small></div>
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}

export function ProjectsContent() {
  const [filter, setFilter] = useState("Featured");
  const projectsData = [
    { id: "arduino-smart-greenhouse", title: "Arduino Smart Greenhouse", subject: "Engineering", tags: ["Arduino", "C++", "Electronics"], tone: "amber" as YomeTone, team: "4 students", progress: "Prototype complete", initials: "SG", description: "An automated greenhouse that monitors soil, light, and temperature." },
    { id: "accessible-campus-navigator", title: "Accessible Campus Navigator", subject: "Technology", tags: ["Computer Vision", "Python", "Accessibility"], tone: "blue" as YomeTone, team: "3 students", progress: "Testing", initials: "CN", description: "Indoor navigation assistance for visually impaired students." },
    { id: "open-source-air-quality-map", title: "Open-source Air Quality Map", subject: "Science", tags: ["Data Science", "Sensors", "Environment"], tone: "teal" as YomeTone, team: "6 contributors", progress: "Live beta", initials: "AQ", description: "Community sensors visualized as an open local air-quality map." },
    { id: "visual-calculus-explorer", title: "Visual Calculus Explorer", subject: "Mathematics", tags: ["React", "Graphs", "Calculus"], tone: "violet" as YomeTone, team: "2 students", progress: "In progress", initials: "VC", description: "Interactive graphs that connect calculus notation to geometric intuition." },
  ];

  return (
    <main className="projects-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Learn by building</p>
          <h1>Projects</h1>
          <span>Discover student work, share progress, and find collaborators.</span>
        </div>
        <button className="primary-button">
          <Plus size={17} /> Add project
        </button>
      </header>

      <section className="project-feature card">
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
            <div className="proof-avatars">
              <Avatar initials="MP" tone="violet" />
              <Avatar initials="AN" tone="amber" />
              <Avatar initials="PS" tone="teal" />
            </div>
            <span>
              <strong>3 collaborators</strong>
              <small>University of Manchester</small>
            </span>
          </div>
          <Link className="primary-button" href="/projects/accessible-campus-navigator">
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
          <article className="project-card-full card" key={project.id}>
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
              <div className="project-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
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
    <main className="project-detail-page">
      <Link className="back-link" href="/projects">← All projects</Link>
      <section className="project-detail-hero card">
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
          <div className="project-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <div className="project-detail-team">
            <div className="proof-avatars">
              <Avatar initials="MP" tone="violet" />
              <Avatar initials="AN" tone="amber" />
              <Avatar initials="PS" tone="teal" />
            </div>
            <span>
              <strong>{project.team}</strong>
              <small>Updated 2 days ago</small>
            </span>
          </div>
          <div className="project-detail-actions">
            <button className={follow ? "secondary-button" : "primary-button"} onClick={() => setFollow((value) => !value)}>
              {follow ? <><Check size={16} /> Following</> : <><Plus size={16} /> Follow project</>}
            </button>
            <button className="secondary-button">
              <MessageCircle size={16} /> Contact team
            </button>
            <button className="icon-button">
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
              <article className="card project-story">
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

              <article className="card project-update">
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
            <div className="groups-tab-state card">
              <div className="empty-icon">
                {tab === "Team" ? <Users size={29} /> : tab === "Resources" ? <Bookmark size={29} /> : <MessageCircle size={29} />}
              </div>
              <h2>{tab}</h2>
              <p>This project section is ready for team records and ongoing contributions.</p>
            </div>
          )}
        </section>

        <aside>
          <section className="card project-side">
            <h3>Project details</h3>
            <div><span>Status</span><strong>{project.progress}</strong></div>
            <div><span>Started</span><strong>May 2026</strong></div>
            <div><span>License</span><strong>Open source</strong></div>
            <div><span>Feedback</span><strong>Welcome</strong></div>
          </section>
          <section className="card project-side">
            <h3>Looking for</h3>
            <Badge tone="blue">UI feedback</Badge>
            <Badge tone="teal">Testing partners</Badge>
            <Badge tone="amber">Electronics mentor</Badge>
            <button className="primary-button">Offer to help</button>
          </section>
          <section className="card project-side">
            <h3>External links</h3>
            <button className="project-link"><FileText size={16} /> Source repository <ArrowRight size={14} /></button>
            <button className="project-link"><FileText size={16} /> Project documentation <ArrowRight size={14} /></button>
          </section>
        </aside>
      </div>
    </main>
  );
}

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
    <main className="events-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Learn live</p>
          <h1>Events & Study Sessions</h1>
          <span>Join revision sessions, workshops, talks, and collaborative project meetings.</span>
        </div>
        <button className="primary-button">
          <Plus size={17} /> Create event
        </button>
      </header>

      <nav className="page-tabs">
        {["Discover", "Your events", "Hosting", "Past"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      <section className="events-calendar-strip card">
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
          <section className="event-feature card">
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
              <div className="event-feature-meta">
                <span><CalendarDays size={16} /><b>Saturday, 2:30 PM</b></span>
                <span><Video size={16} /><b>Live video session</b></span>
                <span><Users size={16} /><b>42 attending</b></span>
              </div>
              <button className="primary-button">Reserve a place</button>
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
                <article className="event-card-full card" key={event.title}>
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
                      <div className="stacked-avatars">
                        <Avatar initials="SC" tone="teal" size="xs" />
                        <Avatar initials="AN" tone="amber" size="xs" />
                        <Avatar initials="MP" tone="violet" size="xs" />
                      </div>
                      <span>{event.attending} attending</span>
                    </div>
                  </div>
                  <button className={isJoined ? "secondary-button joined" : "primary-button"} onClick={() => setJoined((current) => isJoined ? current.filter((value) => value !== event.title) : [...current, event.title])}>
                    {isJoined ? <><Check size={15} /> Joined</> : "Join event"}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="groups-tab-state card">
          <div className="empty-icon"><CalendarDays size={30} /></div>
          <h2>{tab}</h2>
          <p>Your event schedule and hosting tools will appear here.</p>
          <button className="primary-button">Browse events</button>
        </div>
      )}
    </main>
  );
}

function StudyRoomDetail({ onLeave }: { onLeave: () => void }) {
  const [muted, setMuted] = useState(false);
  const [chat, setChat] = useState([
    "Sarah: Welcome! We’re working through question 4.",
    "James: I added my notes to the shared resources.",
  ]);
  const [draft, setDraft] = useState("");

  const send = () => {
    if (!draft.trim()) return;
    setChat((items) => [...items, `You: ${draft.trim()}`]);
    setDraft("");
  };

  return (
    <main className="study-room-detail">
      <header>
        <button className="back-link" onClick={onLeave}>← Leave room</button>
        <div>
          <span className="live-dot" />
          <strong>Calculus Revision Room</strong>
          <small>Mathematics · 8 studying</small>
        </div>
        <button className="secondary-button"><Settings size={16} /> Room settings</button>
      </header>
      <div className="study-room-workspace">
        <section className="study-stage">
          <div className="study-stage-top">
            <Badge tone="violet">Focus session 2 of 4</Badge>
            <div className="stage-timer"><strong>24:18</strong><span>remaining</span></div>
            <button><MoreHorizontal size={18} /></button>
          </div>
          <div className="participant-grid">
            <ParticipantTile name="Sarah Chen" initials="SC" tone="teal" speaking />
            <ParticipantTile name="Maya Patel (You)" initials="MP" tone="violet" muted={muted} />
            <ParticipantTile name="James Liu" initials="JL" tone="blue" />
            <ParticipantTile name="Alex Nguyen" initials="AN" tone="amber" muted />
          </div>
          <div className="stage-note">
            <span>Σ</span>
            <div>
              <strong>Current focus: Integration by parts</strong>
              <p>Work independently until the timer ends, then compare approaches.</p>
            </div>
            <button>Open whiteboard</button>
          </div>
        </section>
        <aside className="room-collab">
          <nav>
            <button className="active">Chat</button>
            <button>People 8</button>
            <button>Resources 3</button>
          </nav>
          <div className="room-chat">
            <div className="room-chat-day">Today</div>
            {chat.map((item, index) => {
              const [author, ...rest] = item.split(":");
              const initials = author === "You" ? "MP" : author === "Sarah" ? "SC" : "JL";
              const tone = author === "You" ? "violet" : author === "Sarah" ? "teal" : "blue";
              return (
                <div className="room-chat-message" key={`${author}-${index}`}>
                  <Avatar initials={initials} tone={tone} size="xs" />
                  <span>
                    <strong>{author}</strong>
                    <p>{rest.join(":")}</p>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="room-chat-compose">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") send();
              }}
              placeholder="Message the room..."
            />
            <button onClick={send}><ArrowRight size={15} /></button>
          </div>
        </aside>
      </div>
      <footer className="room-control-bar">
        <div className="room-status">
          <span className="live-dot" />
          <div>
            <strong>Connected</strong>
            <small>Good connection</small>
          </div>
        </div>
        <div className="room-controls">
          <CallControl active={muted} icon={muted ? <MicOff size={20} /> : <Mic size={20} />} label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((value) => !value)} />
          <CallControl icon={<Video size={20} />} label="Start video" />
          <CallControl icon={<MonitorUp size={20} />} label="Share screen" />
          <CallControl icon={<Users size={20} />} label="Raise hand" />
          <CallControl icon={<MessageCircle size={20} />} label="Chat" />
        </div>
        <button className="leave-room-button" onClick={onLeave}>Leave room</button>
      </footer>
    </main>
  );
}

function ParticipantTile({
  name,
  initials,
  tone,
  speaking = false,
  muted = false,
}: {
  name: string;
  initials: string;
  tone: YomeTone;
  speaking?: boolean;
  muted?: boolean;
}) {
  return (
    <article className={`participant-tile ${speaking ? "speaking" : ""}`}>
      <div className="participant-bg">
        <span>{initials}</span>
        <i />
        <i />
      </div>
      <div className="participant-name">
        <span className={speaking ? "speaking-dot" : ""} />
        <strong>{name}</strong>
        {muted ? <MicOff size={13} /> : null}
      </div>
    </article>
  );
}

function CallControl({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={active ? "call-control active" : "call-control"} onClick={onClick}>
      <span>{icon}</span>
      <small>{label}</small>
    </button>
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
