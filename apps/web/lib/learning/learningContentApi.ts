import axios from "axios";
import {
  LEARNING_EVENTS_ROUTE,
  LEARNING_PROJECTS_ROUTE,
} from "@/utils/ApiRoutes";
import { getClientErrorMessage } from "@/lib/api/clientErrors";
import type { YomeTone } from "@/features/learning/data";

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

type ApiEvent = Partial<LearningEvent>;
type ApiProject = Partial<LearningProject>;

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
