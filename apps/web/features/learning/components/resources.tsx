"use client";

import Link from "next/link";
import { Bookmark, FileText, HelpCircle, Plus, Search, Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Avatar, Badge } from "@/components/ui";
import type { YomeTone } from "@/types/yome-ui";
import {
  formatResourceCount,
  getResource,
  getResourceHref,
  getResources,
  getResourcesErrorMessage,
  markResourceHelpful,
  saveResource,
  unsaveResource,
} from "@/features/learning/api/resourcesApi";
import type { LearningResource } from "@/features/learning/types/resources";

const SUBJECTS = ["All", "Science", "Technology", "Engineering", "Mathematics"];
const RESOURCE_TYPES = [
  { label: "All types", value: "All" },
  { label: "PDF & documents", value: "PDF" },
  { label: "Videos", value: "VIDEO" },
  { label: "Code repositories", value: "CODE" },
  { label: "Study notes", value: "NOTES" },
  { label: "Guides", value: "GUIDE" },
];
const LEVELS = ["All levels", "Beginner", "GCSE", "A Level", "Intermediate", "Undergraduate", "Postgraduate"];
const SORT_OPTIONS = [
  { label: "Most helpful", value: "helpful" },
  { label: "Most recent", value: "recent" },
  { label: "Most saved", value: "saved" },
] as const;

const initialsFor = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const daysAgo = (value: string) => {
  const createdAt = new Date(value).getTime();
  if (!Number.isFinite(createdAt)) return "recently";
  const days = Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
};

const resourceIdentity = (resource: LearningResource) => resource.slug || resource.id;

const ratingLabel = (resource: LearningResource) =>
  resource.ratingAverage === null ? "New" : resource.ratingAverage.toFixed(1);

function StateCard({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="card rounded-yome border border-yome-border bg-yome-surface p-6 text-yome-text shadow-yome">
      <h3 className="text-sm font-bold text-yome-navy">{title}</h3>
      <p className="mt-2 text-xs text-yome-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ResourcesContent() {
  const [subject, setSubject] = useState("All");
  const [type, setType] = useState("All");
  const [level, setLevel] = useState("All levels");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("helpful");
  const [query, setQuery] = useState("");
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getResources({
        search: query || undefined,
        subject: subject === "All" ? undefined : subject,
        type: type === "All" ? undefined : type,
        level: level === "All levels" ? undefined : level,
        sort,
        limit: 50,
      });
      setResources(result.resources);
    } catch (loadError) {
      setError(getResourcesErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [level, query, sort, subject, type]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const subjectCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of resources) {
      counts.set(item.subject, (counts.get(item.subject) ?? 0) + 1);
    }
    return counts;
  }, [resources]);

  const updateResource = (updated: LearningResource) => {
    setResources((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const toggleSave = async (resource: LearningResource) => {
    setActionError(null);
    try {
      const updated = resource.isSaved
        ? await unsaveResource(resourceIdentity(resource))
        : await saveResource(resourceIdentity(resource));
      updateResource(updated);
    } catch (saveError) {
      setActionError(getResourcesErrorMessage(saveError, "Unable to update saved resources."));
    }
  };

  return (
    <main className="resource-library-page min-w-0 text-yome-text">
      <header className="page-heading flex items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Shared knowledge</p>
          <h1>Resource Library</h1>
          <span>Useful notes, guides, code, diagrams, and lessons organized for learning.</span>
        </div>
        <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">
          <Plus size={17} /> Share resource
        </button>
      </header>

      <section className="resource-search-hero">
        <div>
          <Search size={21} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides, notes, subjects, or topics..."
          />
          <button onClick={() => void loadResources()}>Search</button>
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
        <aside className="library-filters card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
          <div className="section-title flex items-center justify-between gap-4">
            <h3>Filters</h3>
            <button
              onClick={() => {
                setSubject("All");
                setType("All");
                setLevel("All levels");
                setQuery("");
              }}
            >
              Clear
            </button>
          </div>
          <label>Subject</label>
          {SUBJECTS.map((item) => (
            <button
              key={item}
              className={subject === item ? "active" : ""}
              onClick={() => setSubject(item)}
            >
              <span className={`filter-dot ${item.toLowerCase()}`} />
              {item}
              <i>{item === "All" ? resources.length : subjectCounts.get(item) ?? 0}</i>
            </button>
          ))}
          <label>Resource type</label>
          {RESOURCE_TYPES.map((item) => (
            <button
              key={item.value}
              className={type === item.value ? "active" : ""}
              onClick={() => setType(item.value)}
            >
              <span /> {item.label}
            </button>
          ))}
          <label>Level</label>
          <select value={level} onChange={(event) => setLevel(event.target.value)}>
            {LEVELS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </aside>

        <section className="resource-results">
          <div className="results-heading">
            <div>
              <h2>{subject === "All" ? "Recommended resources" : subject}</h2>
              <p>{resources.length} useful resources</p>
            </div>
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as (typeof SORT_OPTIONS)[number]["value"])
              }
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {actionError ? (
            <p className="mb-3 text-xs font-bold text-red-600">{actionError}</p>
          ) : null}

          {isLoading ? (
            <StateCard title="Loading resources" body="Fetching the latest shared learning resources." />
          ) : error ? (
            <StateCard
              title="Resources could not load"
              body={error}
              action={
                <button
                  className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue"
                  onClick={() => void loadResources()}
                >
                  Try again
                </button>
              }
            />
          ) : resources.length === 0 ? (
            <StateCard
              title="No resources found"
              body="Try a different search term, subject, resource type, or level."
            />
          ) : (
            <div className="resource-library-grid">
              {resources.map((item) => (
                <article
                  className="library-resource-card card rounded-yome border border-yome-border bg-yome-surface shadow-yome"
                  key={item.id}
                >
                  <Link className={`resource-preview ${item.tone}`} href={`/resources/${resourceIdentity(item)}`}>
                    <span className="resource-preview-type">{item.type}</span>
                    <div className="resource-preview-lines"><i /><i /><i /><i /></div>
                    <strong>{item.topic}</strong>
                  </Link>
                  <div className="library-resource-body">
                    <div className="resource-labels">
                      <Badge tone={item.tone as YomeTone}>{item.subject}</Badge>
                      <Badge tone="neutral">{item.level}</Badge>
                    </div>
                    <Link className="resource-title-link" href={`/resources/${resourceIdentity(item)}`}>
                      {item.title}
                    </Link>
                    <p>{item.description}</p>
                    <div className="resource-author">
                      <Avatar
                        initials={initialsFor(item.author.name)}
                        tone={item.tone as YomeTone}
                        size="xs"
                        image={item.author.profilePicture}
                      />
                      <span>
                        <strong>{item.author.name}</strong>
                        <small>Uploaded {daysAgo(item.createdAt)}</small>
                      </span>
                    </div>
                    <footer>
                      <span>★ {ratingLabel(item)} · {formatResourceCount(item.saveCount)} saves</span>
                      <button
                        className={item.isSaved ? "saved" : ""}
                        onClick={() => void toggleSave(item)}
                        aria-label={item.isSaved ? "Unsave resource" : "Save resource"}
                      >
                        <Bookmark size={16} fill={item.isSaved ? "currentColor" : "none"} />
                      </button>
                    </footer>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export function ResourceDetailContent({ id }: { id: string }) {
  const [resource, setResource] = useState<LearningResource | null>(null);
  const [relatedResources, setRelatedResources] = useState<LearningResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadResource = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getResource(id);
      setResource(result.resource);
      setRelatedResources(result.relatedResources);
    } catch (loadError) {
      setError(getResourcesErrorMessage(loadError, "Unable to load this resource."));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadResource();
  }, [loadResource]);

  const updateResource = (updated: LearningResource) => {
    setResource(updated);
    setRelatedResources((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const toggleSave = async () => {
    if (!resource) return;
    setActionError(null);
    try {
      const updated = resource.isSaved
        ? await unsaveResource(resourceIdentity(resource))
        : await saveResource(resourceIdentity(resource));
      updateResource(updated);
    } catch (saveError) {
      setActionError(getResourcesErrorMessage(saveError, "Unable to update saved resources."));
    }
  };

  const markHelpful = async () => {
    if (!resource || resource.isHelpful) return;
    setActionError(null);
    try {
      const updated = await markResourceHelpful(resourceIdentity(resource));
      updateResource(updated);
    } catch (helpfulError) {
      setActionError(getResourcesErrorMessage(helpfulError, "Unable to mark this resource helpful."));
    }
  };

  if (isLoading) {
    return (
      <main className="resource-detail-page min-w-0 text-yome-text">
        <Link className="back-link inline-flex items-center gap-2 font-bold text-yome-blue" href="/resources">← Resource Library</Link>
        <StateCard title="Loading resource" body="Opening the latest version of this shared resource." />
      </main>
    );
  }

  if (error || !resource) {
    return (
      <main className="resource-detail-page min-w-0 text-yome-text">
        <Link className="back-link inline-flex items-center gap-2 font-bold text-yome-blue" href="/resources">← Resource Library</Link>
        <StateCard
          title="Resource could not load"
          body={error ?? "This resource was not found."}
          action={
            <button
              className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue"
              onClick={() => void loadResource()}
            >
              Try again
            </button>
          }
        />
      </main>
    );
  }

  const href = getResourceHref(resource);

  return (
    <main className="resource-detail-page min-w-0 text-yome-text">
      <Link className="back-link inline-flex items-center gap-2 font-bold text-yome-blue" href="/resources">← Resource Library</Link>
      {actionError ? <p className="mb-3 text-xs font-bold text-red-600">{actionError}</p> : null}
      <div className="resource-detail-layout">
        <section>
          <article className="resource-document card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <header>
              <div>
                <Badge tone={resource.tone as YomeTone}>{resource.subject}</Badge>
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
              <span>Preview resource summary</span>
              <a
                className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer" : undefined}
              >
                <FileText size={15} /> Open resource
              </a>
            </footer>
          </article>

          <article className="resource-discussion card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h2>About this resource</h2>
            <p>{resource.description} This resource was reviewed by the community and tagged for clear explanations and practical examples.</p>
            <div className="resource-topics flex flex-wrap items-center gap-2">
              <Badge tone={resource.tone as YomeTone}>{resource.topic}</Badge>
              <Badge tone="neutral">Visual learning</Badge>
              <Badge tone="neutral">Practice included</Badge>
            </div>
            <footer>
              <button className={resource.isHelpful ? "active" : ""} onClick={() => void markHelpful()}>
                <HelpCircle size={16} /> {resource.isHelpful ? "Marked helpful" : "Was this helpful?"}
              </button>
              <button><Share2 size={16} /> Share</button>
              <button>Report</button>
            </footer>
          </article>
        </section>

        <aside>
          <section className="card resource-side rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <div className="resource-side-author">
              <Avatar
                initials={initialsFor(resource.author.name)}
                tone={resource.tone as YomeTone}
                size="lg"
                image={resource.author.profilePicture}
              />
              <div>
                <strong>{resource.author.name}</strong>
                <p>Helpful contributor</p>
              </div>
            </div>
            <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue">View profile</button>
          </section>

          <section className="card resource-side rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h3>Resource details</h3>
            <div><span>Format</span><strong>{resource.type}</strong></div>
            <div><span>Topic</span><strong>{resource.topic}</strong></div>
            <div><span>Uploaded</span><strong>{daysAgo(resource.createdAt)}</strong></div>
            <div><span>Rating</span><strong>★ {ratingLabel(resource)}</strong></div>
            <div><span>Saves</span><strong>{formatResourceCount(resource.saveCount)}</strong></div>
            <button
              className={resource.isSaved ? "secondary-button saved inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" : "primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"}
              onClick={() => void toggleSave()}
            >
              <Bookmark size={16} fill={resource.isSaved ? "currentColor" : "none"} /> {resource.isSaved ? "Saved" : "Save resource"}
            </button>
          </section>

          <section className="card resource-side rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h3>Related resources</h3>
            {relatedResources.length === 0 ? (
              <p className="text-xs text-yome-muted">No related resources yet.</p>
            ) : (
              relatedResources.map((item) => (
                <Link className="related-resource" href={`/resources/${resourceIdentity(item)}`} key={item.id}>
                  <span>{item.type.slice(0, 3)}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{formatResourceCount(item.saveCount)} saves</small>
                  </div>
                </Link>
              ))
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
