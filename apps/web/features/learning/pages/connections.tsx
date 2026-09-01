"use client";

import Link from "next/link";
import { Check, MessageCircle, MoreHorizontal, Plus, Search, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, Badge } from "@/components/ui";
import {
  followLearningUser,
  getConnectionSummary,
  getConnectionSuggestions,
  getFollowingConnections,
  getLearningErrorMessage,
  type ConnectionSummary,
  type LearningUser,
} from "@/lib/learning/learningApi";

export function ConnectionsContent() {
  const [tab, setTab] = useState("Suggestions");
  const [summary, setSummary] = useState<ConnectionSummary>({
    connections: 0,
    pendingRequests: 0,
    following: 0,
    sharedCommunities: 0,
  });
  const [suggestions, setSuggestions] = useState<LearningUser[]>([]);
  const [following, setFollowing] = useState<LearningUser[]>([]);
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { data: session, status } = useSession();
  const loggedInUserId = Number((session?.user as { id?: unknown } | undefined)?.id);
  const canLoad = status === "authenticated" && Number.isFinite(loggedInUserId);

  useEffect(() => {
    let cancelled = false;

    async function loadConnections() {
      if (!canLoad) {
        if (status !== "loading") setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError("");
      try {
        const [nextSummary, nextSuggestions, nextFollowing] = await Promise.all([
          getConnectionSummary(loggedInUserId),
          getConnectionSuggestions(loggedInUserId),
          getFollowingConnections(loggedInUserId),
        ]);
        if (cancelled) return;
        setSummary(nextSummary);
        setSuggestions(nextSuggestions);
        setFollowing(nextFollowing);
      } catch (loadError) {
        if (!cancelled) {
          setError(getLearningErrorMessage(loadError, "Unable to load connections."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadConnections();
    return () => {
      cancelled = true;
    };
  }, [canLoad, loggedInUserId, status]);

  const handleConnect = async (person: LearningUser) => {
    if (!canLoad || pendingIds.includes(person.id)) return;
    setPendingIds((current) => [...current, person.id]);
    try {
      await followLearningUser(loggedInUserId, person.id);
      const connected = { ...person, isFollowing: true };
      setSuggestions((current) => current.filter((item) => item.id !== person.id));
      setFollowing((current) =>
        current.some((item) => item.id === person.id) ? current : [connected, ...current]
      );
      setSummary((current) => ({
        ...current,
        connections: current.connections + 1,
        following: current.following + 1,
      }));
    } finally {
      setPendingIds((current) => current.filter((id) => id !== person.id));
    }
  };

  return (
    <main className="connections-page min-w-0 text-yome-text">
      <header className="page-heading flex items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Your network</p>
          <h1>Connections</h1>
          <span>Build an academic network around shared interests and useful collaboration.</span>
        </div>
        <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue"><Search size={17} /> Find people</button>
      </header>
      <div className="connection-summary">
        <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome"><strong>{summary.connections}</strong><span>Connections</span></article>
        <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome"><strong>{summary.pendingRequests}</strong><span>Pending requests</span></article>
        <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome"><strong>{summary.following}</strong><span>People you follow</span></article>
        <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome"><strong>{summary.sharedCommunities}</strong><span>Shared communities</span></article>
      </div>
      <nav className="page-tabs connection-tabs flex items-center gap-2 overflow-x-auto">
        {["Suggestions", "Requests", "Your connections", "Following"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
            {item === "Requests" && summary.pendingRequests ? <em>{summary.pendingRequests}</em> : null}
          </button>
        ))}
      </nav>
      {isLoading ? <ConnectionState title="Loading connections..." /> : null}
      {error ? <ConnectionState title="Unable to load connections" body={error} /> : null}
      {!isLoading && !error && tab === "Suggestions" ? (
        suggestions.length ? (
        <div className="connections-grid">
          {suggestions.map((person) => (
              <article className="connection-card card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={person.id}>
                <div className="connection-cover"><div className="cover-grid" /></div>
                <Avatar initials={person.initials} tone={person.tone} size="lg" />
                <button className="more-button inline-grid shrink-0 place-items-center rounded-full text-yome-muted"><MoreHorizontal size={18} /></button>
                <h3>{person.name}</h3>
                <p>{person.role}</p>
                <small>{person.shared}</small>
                <div className="connection-tags"><Badge tone={person.tone}>Shared interests</Badge></div>
                <footer>
                  <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white" disabled={pendingIds.includes(person.id)} onClick={() => handleConnect(person)}>
                    {pendingIds.includes(person.id) ? <Check size={15} /> : <Plus size={15} />} {pendingIds.includes(person.id) ? "Connecting..." : "Connect"}
                  </button>
                  <Link className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" href="/chat"><MessageCircle size={15} /></Link>
                </footer>
              </article>
          ))}
        </div>
        ) : <ConnectionState title="No suggestions yet" body="Followed people will move into your connections list." />
      ) : null}
      {!isLoading && !error && tab === "Requests" ? (
        <ConnectionState title="No pending requests" body="Connections use one-way following in this version." />
      ) : null}
      {!isLoading && !error && tab !== "Suggestions" && tab !== "Requests" ? (
        following.length ? (
        <div className="connection-list card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
          {following.map((person) => (
            <article key={person.id}>
              <Avatar initials={person.initials} tone={person.tone} />
              <div>
                <strong>{person.name}</strong>
                <p>{person.role}</p>
              </div>
              <Badge tone="neutral">Connected</Badge>
              <Link className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" href="/chat"><MessageCircle size={15} /> Message</Link>
              <button className="more-button inline-grid shrink-0 place-items-center rounded-full text-yome-muted"><MoreHorizontal size={18} /></button>
            </article>
          ))}
        </div>
        ) : <ConnectionState title="No connections yet" body="People you follow will appear here." />
      ) : null}
    </main>
  );
}

function ConnectionState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="groups-tab-state card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
      <div className="empty-icon"><UsersRound size={30} /></div>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}
