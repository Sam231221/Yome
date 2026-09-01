"use client";

import Link from "next/link";
import { ArrowRight, Plus, Search, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui";
import {
  getDiscoverGroups,
  getGroupInvitations,
  getJoinedGroups,
  getLearningErrorMessage,
  joinLearningGroup,
  type GroupInvitation,
  type LearningGroup,
} from "@/lib/learning/learningApi";
import { GroupCard } from "./shared";

export function GroupsContent() {
  const [tab, setTab] = useState("Discover");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [sort, setSort] = useState("featured");
  const [discoverGroups, setDiscoverGroups] = useState<LearningGroup[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<LearningGroup[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { data: session, status } = useSession();
  const loggedInUserId = Number((session?.user as { id?: unknown } | undefined)?.id);
  const canLoadPersonalData = status === "authenticated" && Number.isFinite(loggedInUserId);

  useEffect(() => {
    let cancelled = false;

    async function loadGroups() {
      setIsLoading(true);
      setError("");
      try {
        const [discover, joined, groupInvitations] = await Promise.all([
          getDiscoverGroups({ query, subject, sort }),
          canLoadPersonalData ? getJoinedGroups(loggedInUserId) : Promise.resolve([]),
          canLoadPersonalData ? getGroupInvitations(loggedInUserId) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setDiscoverGroups(discover);
        setJoinedGroups(joined);
        setInvitations(groupInvitations);
      } catch (loadError) {
        if (!cancelled) setError(getLearningErrorMessage(loadError, "Unable to load groups."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadGroups();
    return () => {
      cancelled = true;
    };
  }, [canLoadPersonalData, loggedInUserId, query, sort, subject]);

  const featuredGroup = useMemo(
    () => discoverGroups.find((group) => group.featured) ?? discoverGroups[0],
    [discoverGroups]
  );

  const handleJoin = async (group: LearningGroup) => {
    if (!canLoadPersonalData) return;
    await joinLearningGroup(loggedInUserId, group.slug || group.id);
    setDiscoverGroups((current) =>
      current.map((item) => (item.id === group.id ? { ...item, isJoined: true } : item))
    );
    setJoinedGroups((current) =>
      current.some((item) => item.id === group.id)
        ? current
        : [{ ...group, isJoined: true }, ...current]
    );
  };

  return (
    <main className="groups-page min-w-0 text-yome-text">
      <header className="page-heading flex items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Communities</p>
          <h1>Learn better together</h1>
          <span>Find a focused group or create a space for your community.</span>
        </div>
        <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"><Plus size={17} /> Create group</button>
      </header>
      <nav className="page-tabs flex items-center gap-2 overflow-x-auto">
        {["Discover", "Your groups", "Invitations"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
            {item === "Invitations" ? <em>2</em> : null}
          </button>
        ))}
      </nav>
      {tab === "Discover" ? (
        <>
          {featuredGroup ? (
            <section className="group-feature card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
              <div className="group-feature-copy">
                <Badge tone={featuredGroup.tone}>Featured community</Badge>
                <h2>{featuredGroup.name}</h2>
                <p>{featuredGroup.about}</p>
                <div>
                  <span>{featuredGroup.members}</span>
                  <span>{featuredGroup.projectCount} projects</span>
                  <span>{featuredGroup.mentorCount} mentors</span>
                </div>
                <Link className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white" href={`/groups/${featuredGroup.slug || featuredGroup.id}`}>
                  Explore the club <ArrowRight size={16} />
                </Link>
              </div>
              <div className="robot-diagram" aria-hidden="true">
                <span className="robot-head"><i /><i /></span>
                <span className="robot-body">{featuredGroup.symbol.slice(0, 1) || "Y"}</span>
                <b className="circuit c1" />
                <b className="circuit c2" />
                <b className="circuit c3" />
              </div>
            </section>
          ) : null}
          <div className="groups-filter">
            <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search communities..." /></label>
            <select value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option>All</option>
              <option>Technology</option>
              <option>Science</option>
              <option>Engineering</option>
              <option>Mathematics</option>
              <option>General</option>
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="active">Most active</option>
              <option value="members">Most members</option>
              <option value="recent">Newest</option>
              <option value="name">Name</option>
            </select>
          </div>
          {isLoading ? <GroupState title="Loading groups..." /> : null}
          {error ? <GroupState title="Unable to load groups" body={error} /> : null}
          {!isLoading && !error && discoverGroups.length === 0 ? (
            <GroupState title="No groups found" body="Try a different search or subject." />
          ) : null}
          {!isLoading && !error && discoverGroups.length > 0 ? (
            <div className="group-list-grid">
              {discoverGroups.map((group) => (
                <GroupCard key={group.id} group={group} onJoin={handleJoin} />
              ))}
            </div>
          ) : null}
        </>
      ) : tab === "Your groups" ? (
        isLoading ? <GroupState title="Loading your groups..." /> : joinedGroups.length ? (
          <div className="group-list-grid">
            {joinedGroups.map((group) => (
              <GroupCard key={group.id} group={group} onJoin={handleJoin} />
            ))}
          </div>
        ) : (
          <GroupState title="Your groups" body="Groups you join will appear here." />
        )
      ) : invitations.length ? (
        <div className="group-list-grid">
          {invitations.map((invitation) => (
            <GroupCard key={invitation.id} group={invitation.group} onJoin={handleJoin} />
          ))}
        </div>
      ) : (
        <GroupState title="Invitations" body="You do not have any group invitations right now." />
      )}
    </main>
  );
}

function GroupState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="groups-tab-state card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
      <div className="empty-icon"><UsersRound size={30} /></div>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}
