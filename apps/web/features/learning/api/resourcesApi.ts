import axios from "axios";
import { RESOURCES_API_ROUTE } from "@/utils/ApiRoutes";
import { getClientErrorMessage } from "@/lib/api/clientErrors";
import type {
  LearningResource,
  ResourceAuthor,
  ResourceDetailResult,
  ResourceListParams,
  ResourceListResult,
  ResourceTone,
} from "@/features/learning/types/resources";

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
const resourceRequestConfig = { withCredentials: true };

export const getResourcesErrorMessage = (
  error: unknown,
  fallback = "Unable to load resources. Please try again."
) => {
  const message = getClientErrorMessage(error, fallback);
  if (
    /max clients|too many clients|connection pool|prisma\./i.test(message)
  ) {
    return "The resource database is temporarily busy. Please try again in a moment.";
  }
  return message;
};

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
  const { data } = await axios.get(RESOURCES_API_ROUTE, {
    ...resourceRequestConfig,
    params,
  });
  const resources = (data?.resources as ApiResource[] | undefined) ?? [];

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
};

export const getResource = async (
  id: string
): Promise<ResourceDetailResult> => {
  const { data } = await axios.get(
    `${RESOURCES_API_ROUTE}/${id}`,
    resourceRequestConfig
  );
  const relatedResources =
    (data?.relatedResources as ApiResource[] | undefined) ?? [];

  return {
    resource: normalizeResource(data?.resource ?? {}),
    relatedResources: relatedResources.map(normalizeResource),
  };
};

export const saveResource = async (id: string) => {
  const { data } = await axios.post(
    `${RESOURCES_API_ROUTE}/${id}/save`,
    undefined,
    resourceRequestConfig
  );
  return normalizeResource(data?.resource ?? {});
};

export const unsaveResource = async (id: string) => {
  const { data } = await axios.delete(
    `${RESOURCES_API_ROUTE}/${id}/save`,
    resourceRequestConfig
  );
  return normalizeResource(data?.resource ?? {});
};

export const markResourceHelpful = async (id: string) => {
  const { data } = await axios.post(
    `${RESOURCES_API_ROUTE}/${id}/helpful`,
    undefined,
    resourceRequestConfig
  );
  return normalizeResource(data?.resource ?? {});
};
