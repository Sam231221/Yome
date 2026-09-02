export type ResourceTone = "violet" | "blue" | "teal" | "amber" | "neutral";

export type ResourceAuthor = {
  id: number;
  name: string;
  username: string;
  profilePicture: string;
};

export type LearningResource = {
  id: string;
  slug: string;
  title: string;
  subject: string;
  topic: string;
  level: string;
  type: string;
  tone: ResourceTone;
  description: string;
  fileUrl: string | null;
  externalUrl: string | null;
  saveCount: number;
  helpfulCount: number;
  ratingAverage: number | null;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  isSaved: boolean;
  isHelpful: boolean;
  author: ResourceAuthor;
};

export type ResourceListParams = {
  search?: string;
  subject?: string;
  type?: string;
  level?: string;
  sort?: "helpful" | "recent" | "saved";
  limit?: number;
  cursor?: string;
};

export type ResourceListResult = {
  resources: LearningResource[];
  pageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export type ResourceDetailResult = {
  resource: LearningResource;
  relatedResources: LearningResource[];
};
