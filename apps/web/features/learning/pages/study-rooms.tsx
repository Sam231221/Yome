"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  Headphones,
  MessageCircle,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Settings,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { Avatar, Badge } from "@/components/ui";
import type { YomeTone } from "@/features/learning/data";
import { useStateProvider } from "@/context/StateContext";
import { ensureUserInfo } from "@/lib/auth/userInfo";
import { getDashboardErrorMessage, getDashboardHome } from "@/lib/dashboard/dashboardApi";
import type { DashboardSession, DashboardStudyRoom } from "@/lib/dashboard/types";

type StudyRoomView = DashboardStudyRoom;

const ROOM_FILTERS = ["All rooms", "Science", "Technology", "Engineering", "Mathematics"];

const fallbackParticipants = [
  { name: "Sarah Chen", initials: "SC", tone: "teal" as YomeTone },
  { name: "Alex Nguyen", initials: "AN", tone: "amber" as YomeTone },
  { name: "Maya Patel", initials: "MP", tone: "violet" as YomeTone },
];

function roomDescription(room: StudyRoomView) {
  if (room.groupName) return `Study with the ${room.groupName} community.`;
  return "Focused study with audio, chat, and screen share.";
}

function sessionTimeLabel(session: DashboardSession) {
  const startsAt = new Date(session.startsAt);
  if (Number.isNaN(startsAt.getTime())) return session.meta;
  return `${startsAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${session.group}`;
}

export function StudyRoomsContent() {
  const [filter, setFilter] = useState("All rooms");
  const [query, setQuery] = useState("");
  const [screen, setScreen] = useState<"rooms" | "detail" | "incoming" | "audio" | "video">("rooms");
  const [callReturnTarget, setCallReturnTarget] = useState<"rooms" | "detail">("rooms");
  const [rooms, setRooms] = useState<StudyRoomView[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<DashboardSession[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<StudyRoomView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { data: session, status } = useSession();
  const [{ userInfo }, dispatch] = useStateProvider();

  const loadStudyRooms = useCallback(async () => {
    if (status === "loading") return;
    setIsLoading(true);
    setError("");
    try {
      const loadedUserInfo = await ensureUserInfo({
        sessionUser: session?.user,
        currentUserInfo: userInfo,
        dispatch,
      });
      const loggedInUserId = loadedUserInfo?.id ?? userInfo?.id;
      if (!loggedInUserId) {
        setError("Unable to identify the current user.");
        return;
      }
      const dashboard = await getDashboardHome(loggedInUserId);
      setRooms(dashboard.liveStudyRooms);
      setScheduledSessions(dashboard.upcomingSessions);
      setSelectedRoom((current) => {
        if (!current) return dashboard.liveStudyRooms[0] ?? null;
        return dashboard.liveStudyRooms.find((room) => room.id === current.id) ?? dashboard.liveStudyRooms[0] ?? null;
      });
    } catch (loadError) {
      setError(getDashboardErrorMessage(loadError, "Unable to load study rooms."));
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, session?.user, status, userInfo]);

  useEffect(() => {
    void loadStudyRooms();
  }, [loadStudyRooms]);

  const visibleRooms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchesFilter = filter === "All rooms" || room.subject === filter;
      const searchable = `${room.title} ${room.subject} ${room.topic} ${room.groupName}`.toLowerCase();
      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [filter, query, rooms]);

  const featuredRoom = visibleRooms[0] ?? rooms[0] ?? null;

  const openRoom = (room: StudyRoomView) => {
    setSelectedRoom(room);
    setScreen("detail");
  };

  if (screen === "detail") {
    return <StudyRoomDetail room={selectedRoom} onLeave={() => setScreen("rooms")} onStartVideo={() => {
      setCallReturnTarget("detail");
      setScreen("video");
    }} />;
  }

  if (screen === "incoming") {
    return (
      <IncomingCallPage
        onAccept={(video) => setScreen(video ? "video" : "audio")}
        onDecline={() => setScreen(callReturnTarget)}
      />
    );
  }

  if (screen === "audio") {
    return (
      <AudioCallPage
        onEnd={() => setScreen(callReturnTarget)}
        onVideo={() => setScreen("video")}
      />
    );
  }

  if (screen === "video") {
    return <VideoCallPage room={selectedRoom} onEnd={() => setScreen(callReturnTarget)} />;
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

      {isLoading ? (
        <section className="study-feature card rounded-yome border border-yome-border bg-yome-surface p-8 text-yome-muted shadow-yome">
          Loading study rooms...
        </section>
      ) : error ? (
        <section className="study-feature card rounded-yome border border-yome-border bg-yome-surface p-8 shadow-yome">
          <strong>Unable to load study rooms</strong>
          <p className="mt-2 text-yome-muted">{error}</p>
          <button className="secondary-button mt-4 inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" onClick={() => void loadStudyRooms()}>
            Try again
          </button>
        </section>
      ) : featuredRoom ? (
        <section className="study-feature card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
          <div className="study-feature-copy">
            <div className="live-badge">
              <span className="live-dot" /> Live now
            </div>
            <Badge tone={featuredRoom.tone}>{featuredRoom.subject} · {featuredRoom.topic}</Badge>
            <h2>{featuredRoom.title}</h2>
            <p>{roomDescription(featuredRoom)} Join with audio, video, or chat only.</p>
            <div className="feature-participants">
              <div className="proof-avatars flex items-center">
                {(featuredRoom.participants.length ? featuredRoom.participants : fallbackParticipants).slice(0, 4).map((participant, index) => (
                  <Avatar
                    key={`${participant.name}-${index}`}
                    initials={participant.initials}
                    tone={fallbackParticipants[index]?.tone ?? featuredRoom.tone}
                    image={"profilePicture" in participant ? participant.profilePicture : undefined}
                  />
                ))}
              </div>
              <span>
                <strong>{featuredRoom.activeParticipantCount} studying now</strong>
                <small>Hosted by {featuredRoom.hostName}</small>
              </span>
            </div>
            <div className="feature-room-actions flex flex-wrap items-center gap-2">
              <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white" onClick={() => openRoom(featuredRoom)}>
                <Headphones size={17} /> Join room
              </button>
              <button
                className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue"
                onClick={() => {
                  setCallReturnTarget("rooms");
                  setScreen("incoming");
                }}
              >
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
      ) : (
        <section className="study-feature card rounded-yome border border-yome-border bg-yome-surface p-8 shadow-yome">
          <strong>No live study rooms</strong>
          <p className="mt-2 text-yome-muted">Live rooms from your learning network will appear here.</p>
        </section>
      )}

      <div className="room-toolbar">
        <nav>
          {ROOM_FILTERS.map((item) => (
            <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </nav>
        <label>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a room..." />
        </label>
      </div>

      <section className="rooms-grid">
        {!isLoading && !error && visibleRooms.length === 0 ? (
          <article className="study-room-card card rounded-yome border border-yome-border bg-yome-surface p-6 shadow-yome">
            <h3>No rooms found</h3>
            <p>Try a different subject filter or search term.</p>
          </article>
        ) : null}
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
            <Badge tone={room.tone}>{room.subject}</Badge>
            <h3>{room.title}</h3>
            <p>{roomDescription(room)}</p>
            <div className="room-features">
              <span><Mic size={13} /> Audio</span>
              <span><MessageCircle size={13} /> Chat</span>
              <span><MonitorUp size={13} /> Share</span>
            </div>
            <footer>
              <div>
                <div className="stacked-avatars flex items-center">
                  {(room.participants.length ? room.participants : fallbackParticipants).slice(0, 3).map((participant, index) => (
                    <Avatar
                      key={`${participant.name}-${index}`}
                      initials={participant.initials}
                      tone={fallbackParticipants[index]?.tone ?? room.tone}
                      size="xs"
                      image={"profilePicture" in participant ? participant.profilePicture : undefined}
                    />
                  ))}
                </div>
                <span>{room.activeParticipantCount} studying</span>
              </div>
              <button onClick={() => openRoom(room)}>
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
          {scheduledSessions.length === 0 ? (
            <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
              <div>
                <h3>No scheduled sessions</h3>
                <p>Upcoming sessions from your groups will appear here.</p>
              </div>
            </article>
          ) : (
            scheduledSessions.map((session) => (
              <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={session.id}>
                <div className={`date-tile ${session.tone === "amber" ? "amber" : ""}`}>
                  <strong>{session.day}</strong>
                  <span>{session.month}</span>
                </div>
                <div>
                  <Badge tone={session.tone}>{session.subject}</Badge>
                  <h3>{session.title}</h3>
                  <p>{sessionTimeLabel(session)}</p>
                </div>
                <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue">Set reminder</button>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}


function StudyRoomDetail({
  room,
  onLeave,
  onStartVideo,
}: {
  room: StudyRoomView | null;
  onLeave: () => void;
  onStartVideo: () => void;
}) {
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

  const title = room?.title ?? "Study Room";
  const subject = room?.subject ?? "General";
  const activeCount = room?.activeParticipantCount ?? 0;
  const participants = room?.participants.length ? room.participants : fallbackParticipants;
  const topic = room?.topic ?? title;
  const tone = room?.tone ?? "blue";

  return (
    <main className="study-room-detail min-w-0 text-yome-text">
      <header>
        <button className="back-link inline-flex items-center gap-2 font-bold text-yome-blue" onClick={onLeave}>← Leave room</button>
        <div>
          <span className="live-dot" />
          <strong>{title}</strong>
          <small>{subject} · {activeCount} studying</small>
        </div>
        <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue"><Settings size={16} /> Room settings</button>
      </header>
      <div className="study-room-workspace">
        <section className="study-stage">
          <div className="study-stage-top">
            <Badge tone={tone}>Focus session 2 of 4</Badge>
            <div className="stage-timer"><strong>24:18</strong><span>remaining</span></div>
            <button><MoreHorizontal size={18} /></button>
          </div>
          <div className="participant-grid">
            {participants.slice(0, 4).map((participant, index) => (
              <ParticipantTile
                key={`${participant.name}-${index}`}
                name={index === 1 ? `${participant.name} (You)` : participant.name}
                initials={participant.initials}
                tone={fallbackParticipants[index]?.tone ?? tone}
                speaking={index === 0}
                muted={index === 1 ? muted : index === 3}
              />
            ))}
          </div>
          <div className="stage-note">
            <span>{room?.symbol ?? "Y"}</span>
            <div>
              <strong>Current focus: {topic}</strong>
              <p>Work independently until the timer ends, then compare approaches.</p>
            </div>
            <button>Open whiteboard</button>
          </div>
        </section>
        <aside className="room-collab">
          <nav>
            <button className="active">Chat</button>
            <button>People {activeCount}</button>
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
          <CallControl icon={<Video size={20} />} label="Start video" onClick={onStartVideo} />
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
  danger = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`call-control${active ? " active" : ""}${danger ? " danger" : ""}`} onClick={onClick}>
      <span>{icon}</span>
      <small>{label}</small>
    </button>
  );
}

function IncomingCallPage({
  onAccept,
  onDecline,
}: {
  onAccept: (video: boolean) => void;
  onDecline: () => void;
}) {
  const [video, setVideo] = useState(false);

  return (
    <main className="incoming-call-page">
      <div className="call-backdrop"><span /><span /><span /></div>
      <div className="incoming-call-card">
        <div className="incoming-label">
          <span className="live-dot" /> Incoming {video ? "video" : "audio"} call
        </div>
        <Avatar initials="PS" tone="violet" size="lg" />
        <h1>Priya Sharma</h1>
        <p>AI student · 5 shared groups</p>
        <div className="incoming-context">
          <MessageCircle size={17} />
          <span>Calling from your conversation</span>
        </div>
        <div className="incoming-actions">
          <CallControl icon={<Phone size={20} />} label="Decline" danger onClick={onDecline} />
          <CallControl
            icon={video ? <VideoOff size={20} /> : <Video size={20} />}
            label={video ? "Video off" : "Video on"}
            active={video}
            onClick={() => setVideo((value) => !value)}
          />
          <CallControl icon={<Phone size={20} />} label="Accept" onClick={() => onAccept(video)} />
        </div>
        <button className="incoming-message" onClick={onDecline}>Reply with a message</button>
      </div>
    </main>
  );
}

function AudioCallPage({
  onEnd,
  onVideo,
}: {
  onEnd: () => void;
  onVideo: () => void;
}) {
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);

  return (
    <main className="audio-call-page">
      <div className="call-top">
        <div className="mini-brand"><span>Y</span> yome call</div>
        <button onClick={onEnd}>
          <ChevronLeft size={16} />
          Back to messages
        </button>
      </div>
      <section className="audio-call-main">
        <div className="audio-orbits"><i /><i /><i /></div>
        <Avatar initials="PS" tone="violet" size="lg" />
        <h1>Priya Sharma</h1>
        <p>00:08:42</p>
        <span className="call-quality"><i className="live-dot" /> Encrypted · Good connection</span>
        <div className="audio-wave">
          {Array.from({ length: 28 }).map((_, index) => (
            <i key={index} style={{ height: `${8 + (index % 7) * 4}px` }} />
          ))}
        </div>
      </section>
      <footer className="call-dock">
        <CallControl icon={muted ? <MicOff size={20} /> : <Mic size={20} />} label={muted ? "Unmute" : "Mute"} active={muted} onClick={() => setMuted((value) => !value)} />
        <CallControl icon={<Headphones size={20} />} label={speaker ? "Speaker on" : "Speaker off"} active={!speaker} onClick={() => setSpeaker((value) => !value)} />
        <CallControl icon={<Users size={20} />} label="Add person" />
        <CallControl icon={<Video size={20} />} label="Switch to video" onClick={onVideo} />
        <CallControl icon={<Phone size={20} />} label="End call" danger onClick={onEnd} />
      </footer>
    </main>
  );
}

function VideoCallPage({ room, onEnd }: { room: StudyRoomView | null; onEnd: () => void }) {
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(true);
  const [hand, setHand] = useState(false);
  const [view, setView] = useState<"Grid" | "Speaker">("Grid");
  const title = room?.title ?? "Study Room";
  const activeCount = room?.activeParticipantCount ?? 0;
  const participants = room?.participants.length ? room.participants : fallbackParticipants;

  return (
    <main className="video-call-page">
      <header>
        <div>
          <span className="live-dot" />
          <strong>{title}</strong>
          <small>{activeCount} participants · 42:16</small>
        </div>
        <nav>
          <button className={view === "Grid" ? "active" : ""} onClick={() => setView("Grid")}>Grid</button>
          <button className={view === "Speaker" ? "active" : ""} onClick={() => setView("Speaker")}>Speaker</button>
        </nav>
        <button><MoreHorizontal size={18} /></button>
      </header>
      <section className={`video-grid ${view === "Speaker" ? "speaker-view" : ""}`}>
        {participants.slice(0, 6).map((participant, index) => (
          <VideoTile
            key={`${participant.name}-${index}`}
            name={index === 1 ? `${participant.name} (You)` : participant.name}
            initials={participant.initials}
            tone={fallbackParticipants[index % fallbackParticipants.length]?.tone ?? "blue"}
            speaking={index === 0}
            camera={index === 1 ? camera : index !== 5}
            muted={index === 1 ? muted : index === 3}
          />
        ))}
      </section>
      <aside className="video-side-note">
        <div className="section-title">
          <h3>Session notes</h3>
          <button>×</button>
        </div>
        <p><strong>Integration by parts</strong></p>
        <ul>
          <li>Start from the product rule</li>
          <li>Choose u to simplify when differentiated</li>
          <li>Check the result by differentiating</li>
        </ul>
        <button>Open collaborative notes</button>
      </aside>
      <footer className="video-call-dock">
        <div>
          <CallControl icon={muted ? <MicOff size={20} /> : <Mic size={20} />} label={muted ? "Unmute" : "Mute"} active={muted} onClick={() => setMuted((value) => !value)} />
          <CallControl icon={camera ? <Video size={20} /> : <VideoOff size={20} />} label={camera ? "Stop video" : "Start video"} active={!camera} onClick={() => setCamera((value) => !value)} />
          <CallControl icon={<MonitorUp size={20} />} label="Share screen" />
          <CallControl icon={<Users size={20} />} label={hand ? "Hand raised" : "Raise hand"} active={hand} onClick={() => setHand((value) => !value)} />
          <CallControl icon={<MessageCircle size={20} />} label="Chat" />
          <CallControl icon={<Phone size={20} />} label="End" danger onClick={onEnd} />
        </div>
      </footer>
    </main>
  );
}

function VideoTile({
  name,
  initials,
  tone,
  speaking = false,
  muted = false,
  camera = true,
}: {
  name: string;
  initials: string;
  tone: YomeTone;
  speaking?: boolean;
  muted?: boolean;
  camera?: boolean;
}) {
  return (
    <article className={`video-tile ${speaking ? "speaking" : ""}`}>
      <div className={`video-person video-${tone}`}>
        {camera ? (
          <>
            <span className="video-avatar-face">{initials}</span>
            <div className="video-abstract"><i /><i /><i /></div>
          </>
        ) : (
          <Avatar initials={initials} tone={tone} size="lg" />
        )}
      </div>
      <footer>
        <span>{speaking ? <i className="live-dot" /> : null}<strong>{name}</strong></span>
        {muted ? <MicOff size={14} /> : null}
      </footer>
    </article>
  );
}
