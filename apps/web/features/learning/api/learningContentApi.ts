import axios from "axios";
import {
  GET_DASHBOARD_HOME,
  LEARNING_EVENTS_ROUTE,
  LEARNING_PROJECTS_ROUTE,
} from "@/utils/ApiRoutes";
import { getClientErrorMessage } from "@/lib/api/clientErrors";
import type { YomeTone } from "@/types/yome-ui";

const learningRequestConfig = { withCredentials: true };
const TONES = new Set<YomeTone>(["blue", "teal", "amber", "violet", "neutral"]);

export type LearningEvent = {
  id: string;
  title: string;
  type: string;
  startsAt: string;
  date: string;
  month: string;
  time: string;
  host: string;
  subject: string;
  attending: number;
  tone: YomeTone;
};

export type LearningProject = {
  id: string;
  title: string;
  subject: string;
  tags: string[];
  tone: YomeTone;
  team: string;
  progress: string;
  stack: string;
  initials: string;
  description: string;
  author: string;
  updatedAt: string;
  helpfulCount: number;
  commentCount: number;
  shareCount: number;
};

export type LearningStudyRoom = {
  id: string;
  title: string;
  meta: string;
  symbol: string;
  tone: YomeTone;
  subject: string;
  topic: string;
  groupName: string;
  hostName: string;
  activeParticipantCount: number;
  participants: Array<{
    name: string;
    initials: string;
    profilePicture: string;
  }>;
};

export type LearningScheduledSession = {
  id: string;
  title: string;
  day: string;
  month: string;
  meta: string;
  group: string;
  subject: string;
  tone: YomeTone;
  startsAt: string;
};

type ApiEvent = Partial<LearningEvent>;
type ApiProject = Partial<LearningProject>;
type ApiStudyRoom = Partial<LearningStudyRoom>;
type ApiScheduledSession = Partial<LearningScheduledSession>;

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const asTone = (value: unknown): YomeTone =>
  typeof value === "string" && TONES.has(value as YomeTone)
    ? (value as YomeTone)
    : "blue";

export const getLearningContentErrorMessage = (
  error: unknown,
  fallback = "Unable to load this page. Please try again."
) => getClientErrorMessage(error, fallback);

export function normalizeLearningEvent(event: ApiEvent): LearningEvent {
  const startsAt = asString(event.startsAt);
  const parsed = new Date(startsAt);
  const hasDate = !Number.isNaN(parsed.getTime());
  return {
    id: asString(event.id, asString(event.title, "event")),
    title: asString(event.title, "Untitled event"),
    type: asString(event.type, "Study session"),
    startsAt,
    date: asString(
      event.date,
      hasDate
        ? new Intl.DateTimeFormat("en", { day: "2-digit" }).format(parsed)
        : "01"
    ),
    month: asString(
      event.month,
      hasDate
        ? new Intl.DateTimeFormat("en", { month: "short" })
            .format(parsed)
            .toUpperCase()
        : "JAN"
    ),
    time: asString(event.time, "Upcoming"),
    host: asString(event.host, "Yome study group"),
    subject: asString(event.subject, "General"),
    attending: asNumber(event.attending),
    tone: asTone(event.tone),
  };
}

export function normalizeLearningProject(project: ApiProject): LearningProject {
  const title = asString(project.title, "Untitled project");
  return {
    id: asString(project.id, title.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    title,
    subject: asString(project.subject, "General"),
    tags: Array.isArray(project.tags) ? project.tags.map(String) : [],
    tone: asTone(project.tone),
    team: asString(project.team, "Yome project team"),
    progress: asString(project.progress, "In progress"),
    stack: asString(project.stack),
    initials: asString(
      project.initials,
      title
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    ),
    description: asString(project.description, "A project shared by Yome learners."),
    author: asString(project.author, "Yome contributor"),
    updatedAt: asString(project.updatedAt, new Date(0).toISOString()),
    helpfulCount: asNumber(project.helpfulCount),
    commentCount: asNumber(project.commentCount),
    shareCount: asNumber(project.shareCount),
  };
}

export function normalizeLearningStudyRoom(room: ApiStudyRoom): LearningStudyRoom {
  return {
    id: asString(room.id),
    title: asString(room.title, "Study room"),
    meta: asString(room.meta, "0 studying now"),
    symbol: asString(room.symbol, "Y"),
    tone: asTone(room.tone),
    subject: asString(room.subject, "General"),
    topic: asString(room.topic, asString(room.title, "Study room")),
    groupName: asString(room.groupName),
    hostName: asString(room.hostName, "Yome host"),
    activeParticipantCount: asNumber(room.activeParticipantCount),
    participants: (room.participants ?? []).map((participant) => ({
      name: asString(participant.name, "Yome user"),
      initials: asString(participant.initials, "Y"),
      profilePicture: asString(participant.profilePicture),
    })),
  };
}

export function normalizeLearningScheduledSession(
  session: ApiScheduledSession
): LearningScheduledSession {
  return {
    id: asString(session.id),
    title: asString(session.title, "Study session"),
    day: asString(session.day, "01"),
    month: asString(session.month, "JAN"),
    meta: asString(session.meta),
    group: asString(session.group, "Yome study group"),
    subject: asString(session.subject, "General"),
    tone: asTone(session.tone),
    startsAt: asString(session.startsAt),
  };
}

export async function getLearningEvents() {
  const { data } = await axios.get(LEARNING_EVENTS_ROUTE, learningRequestConfig);
  return ((data?.events as ApiEvent[] | undefined) ?? []).map(normalizeLearningEvent);
}

export async function getLearningProjects() {
  const { data } = await axios.get(LEARNING_PROJECTS_ROUTE, learningRequestConfig);
  return ((data?.projects as ApiProject[] | undefined) ?? []).map(normalizeLearningProject);
}

export async function getLearningProject(id: string) {
  const { data } = await axios.get(
    `${LEARNING_PROJECTS_ROUTE}/${id}`,
    learningRequestConfig
  );
  return normalizeLearningProject(data?.project ?? {});
}

export async function getLearningStudyRooms(loggedInUserId: number) {
  const { data } = await axios.get(
    `${GET_DASHBOARD_HOME}/${loggedInUserId}`,
    learningRequestConfig
  );
  const dashboard = data?.dashboard ?? {};

  return {
    liveStudyRooms: ((dashboard.liveStudyRooms as ApiStudyRoom[] | undefined) ?? []).map(
      normalizeLearningStudyRoom
    ),
    upcomingSessions: (
      (dashboard.upcomingSessions as ApiScheduledSession[] | undefined) ?? []
    ).map(normalizeLearningScheduledSession),
  };
}
