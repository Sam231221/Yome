import axios from "axios";
import { RESOURCES_API_ROUTE } from "@/utils/ApiRoutes";
import { getClientErrorMessage } from "@/lib/api/clientErrors";
import { fallbackResources } from "@/lib/resources/fallbackResources";
import type {
  LearningResource,
  ResourceAuthor,
  ResourceDetailResult,
  ResourceListParams,
  ResourceListResult,
  ResourceTone,
} from "@/lib/resources/types";

type ApiResource = Omit<Partial<LearningResource>, "author"> & {
  author?: Partial<ResourceAuthor> | null;
};

const DEFAULT_AUTHOR_AVATAR = "/avatars/userprofile.png";
const RESOURCE_TONES = new Set<ResourceTone>([
  "violet",
  "blue",
  "teal",
  "amber",
  "neutral",
]);

export const getResourcesErrorMessage = (
  error: unknown,
  fallback = "Unable to load resources. Please try again."
) => getClientErrorMessage(error, fallback);

const asNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asTone = (value: unknown): ResourceTone =>
  typeof value === "string" && RESOURCE_TONES.has(value as ResourceTone)
    ? (value as ResourceTone)
    : "blue";

export const formatResourceCount = (count: number) => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}m`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
};

export const normalizeResource = (resource: ApiResource): LearningResource => {
  const author: Partial<ResourceAuthor> = resource.author ?? {};
  const title = asString(resource.title, "Untitled resource");
  const slug = asString(resource.slug, asString(resource.id, ""));

  return {
    id: asString(resource.id, slug),
    slug,
    title,
    subject: asString(resource.subject, "General"),
    topic: asString(resource.topic, "Learning"),
    level: asString(resource.level, "All levels"),
    type: asString(resource.type, "RESOURCE").toUpperCase(),
    tone: asTone(resource.tone),
    description: asString(resource.description, "A learning resource shared on Yome."),
    fileUrl: resource.fileUrl || null,
    externalUrl: resource.externalUrl || null,
    saveCount: asNumber(resource.saveCount),
    helpfulCount: asNumber(resource.helpfulCount),
    ratingAverage:
      resource.ratingAverage === null || resource.ratingAverage === undefined
        ? null
        : asNumber(resource.ratingAverage),
    ratingCount: asNumber(resource.ratingCount),
    createdAt: asString(resource.createdAt, new Date(0).toISOString()),
    updatedAt: asString(resource.updatedAt, new Date(0).toISOString()),
    isSaved: Boolean(resource.isSaved),
    isHelpful: Boolean(resource.isHelpful),
    author: {
      id: asNumber(author.id),
      name: asString(author.name, asString(author.username, "Yome contributor")),
      username: asString(author.username, ""),
      profilePicture: asString(author.profilePicture, DEFAULT_AUTHOR_AVATAR),
    },
  };
};

export const getResourceHref = (resource: LearningResource) =>
  resource.fileUrl || resource.externalUrl || `/resources/${resource.slug || resource.id}`;

export const getResources = async (
  params: ResourceListParams = {}
): Promise<ResourceListResult> => {
  try {
    const { data } = await axios.get(RESOURCES_API_ROUTE, { params });
    const resources = (data?.resources as ApiResource[] | undefined) ?? [];

    if (resources.length === 0) {
      return {
        resources: filterFallbackResources(params),
        pageInfo: { nextCursor: null, hasMore: false },
      };
    }

    return {
      resources: resources.map(normalizeResource),
      pageInfo: {
        nextCursor:
          typeof data?.pageInfo?.nextCursor === "string"
            ? data.pageInfo.nextCursor
            : null,
        hasMore: Boolean(data?.pageInfo?.hasMore),
      },
    };
  } catch {
    return {
      resources: filterFallbackResources(params),
      pageInfo: { nextCursor: null, hasMore: false },
    };
  }
};

export const getResource = async (
  id: string
): Promise<ResourceDetailResult> => {
  try {
    const { data } = await axios.get(`${RESOURCES_API_ROUTE}/${id}`);
    const relatedResources =
      (data?.relatedResources as ApiResource[] | undefined) ?? [];

    return {
      resource: normalizeResource(data?.resource ?? {}),
      relatedResources: relatedResources.map(normalizeResource),
    };
  } catch {
    const resource =
      fallbackResources.find((item) => item.id === id || item.slug === id) ??
      fallbackResources[0];
    return {
      resource,
      relatedResources: fallbackResources
        .filter(
          (item) =>
            item.id !== resource.id &&
            (item.subject === resource.subject || item.topic === resource.topic)
        )
        .slice(0, 4),
    };
  }
};

export const saveResource = async (id: string) => {
  const { data } = await axios.post(`${RESOURCES_API_ROUTE}/${id}/save`);
  return normalizeResource(data?.resource ?? {});
};

export const unsaveResource = async (id: string) => {
  const { data } = await axios.delete(`${RESOURCES_API_ROUTE}/${id}/save`);
  return normalizeResource(data?.resource ?? {});
};

export const markResourceHelpful = async (id: string) => {
  const { data } = await axios.post(`${RESOURCES_API_ROUTE}/${id}/helpful`);
  return normalizeResource(data?.resource ?? {});
};

function filterFallbackResources(params: ResourceListParams) {
  const search = params.search?.trim().toLowerCase() ?? "";
  const subject = params.subject && params.subject !== "All" ? params.subject : "";
  const type = params.type && params.type !== "All" ? params.type : "";
  const level = params.level && params.level !== "All levels" ? params.level : "";

  return fallbackResources.filter((resource) => {
    const matchesSearch =
      !search ||
      `${resource.title} ${resource.subject} ${resource.topic} ${resource.description} ${resource.author.name}`
        .toLowerCase()
        .includes(search);
    return (
      matchesSearch &&
      (!subject || resource.subject === subject) &&
      (!type || resource.type === type) &&
      (!level || resource.level === level)
    );
  });
}
