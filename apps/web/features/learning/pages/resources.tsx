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
        <aside className="library-filters card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
          <div className="section-title flex items-center justify-between gap-4">
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
                <article className="library-resource-card card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={item.id}>
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
    <main className="resource-detail-page min-w-0 text-yome-text">
      <Link className="back-link inline-flex items-center gap-2 font-bold text-yome-blue" href="/resources">← Resource Library</Link>
      <div className="resource-detail-layout">
        <section>
          <article className="resource-document card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
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
              <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">
                <FileText size={15} /> Open resource
              </button>
            </footer>
          </article>

          <article className="resource-discussion card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h2>About this resource</h2>
            <p>{resource.description} This resource was reviewed by the community and tagged for clear explanations and practical examples.</p>
            <div className="resource-topics flex flex-wrap items-center gap-2">
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
          <section className="card resource-side rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <div className="resource-side-author">
              <Avatar initials={resource.author.split(" ").map((name) => name[0]).join("").slice(0, 2)} tone={resource.tone} size="lg" />
              <div>
                <strong>{resource.author}</strong>
                <p>Helpful contributor</p>
              </div>
            </div>
            <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue">View profile</button>
          </section>

          <section className="card resource-side rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h3>Resource details</h3>
            <div><span>Format</span><strong>{resource.type}</strong></div>
            <div><span>Pages</span><strong>18</strong></div>
            <div><span>Uploaded</span><strong>3 days ago</strong></div>
            <div><span>Rating</span><strong>★ {resource.rating}</strong></div>
            <div><span>Saves</span><strong>{resource.saves}</strong></div>
            <button className={saved ? "secondary-button saved inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" : "primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"} onClick={() => setSaved((value) => !value)}>
              <Bookmark size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save resource"}
            </button>
          </section>

          <section className="card resource-side rounded-yome border border-yome-border bg-yome-surface shadow-yome">
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
