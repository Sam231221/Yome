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
    <main className="study-rooms-page min-w-0 text-yome-text">
      <header className="study-heading">
        <div>
          <p className="eyebrow">Live collaboration</p>
          <h1>Study Rooms</h1>
          <span>Focused spaces to study, ask questions, and work alongside other learners.</span>
        </div>
        <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">
          <Plus size={17} /> Create room
        </button>
      </header>

      <section className="study-feature card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
        <div className="study-feature-copy">
          <div className="live-badge">
            <span className="live-dot" /> Live now
          </div>
          <Badge tone="violet">Mathematics · Calculus</Badge>
          <h2>Calculus Revision Room</h2>
          <p>Integration techniques, exam practice, and a shared focus timer. Join with audio, video, or chat only.</p>
          <div className="feature-participants">
            <div className="proof-avatars flex items-center">
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
          <div className="feature-room-actions flex flex-wrap items-center gap-2">
            <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white" onClick={() => setOpenRoom(true)}>
              <Headphones size={17} /> Join room
            </button>
            <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue">
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
          <article className="study-room-card card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={room.id}>
            <header>
              <div className={`study-room-symbol ${room.tone}`}>{room.symbol}</div>
              <span className="live-badge">
                <i className="live-dot" /> Live
              </span>
              <button className="more-button inline-grid shrink-0 place-items-center rounded-full text-yome-muted">
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
                <div className="stacked-avatars flex items-center">
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
        <div className="discover-section-title flex items-end justify-between gap-5 items-center gap-4">
          <div>
            <h2>Scheduled sessions</h2>
            <p>Plan ahead and get a reminder before rooms open.</p>
          </div>
          <button>
            View calendar <ArrowRight size={14} />
          </button>
        </div>
        <div>
          <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <div className="date-tile">
              <strong>30</strong>
              <span>AUG</span>
            </div>
            <div>
              <Badge tone="blue">Technology</Badge>
              <h3>Intro to machine learning</h3>
              <p>2:30 PM · 42 interested</p>
            </div>
            <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue">Set reminder</button>
          </article>
          <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <div className="date-tile amber">
              <strong>02</strong>
              <span>SEP</span>
            </div>
            <div>
              <Badge tone="amber">Engineering</Badge>
              <h3>Arduino build clinic</h3>
              <p>5:00 PM · 28 interested</p>
            </div>
            <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue">Set reminder</button>
          </article>
        </div>
      </section>
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
    <main className="study-room-detail min-w-0 text-yome-text">
      <header>
        <button className="back-link inline-flex items-center gap-2 font-bold text-yome-blue" onClick={onLeave}>← Leave room</button>
        <div>
          <span className="live-dot" />
          <strong>Calculus Revision Room</strong>
          <small>Mathematics · 8 studying</small>
        </div>
        <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue"><Settings size={16} /> Room settings</button>
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
  icon: ReactNode;
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
