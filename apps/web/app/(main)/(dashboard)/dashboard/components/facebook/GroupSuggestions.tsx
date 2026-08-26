"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { BsPeople, BsThreeDots } from "react-icons/bs";
import { useStateProvider } from "@/context/StateContext";
import type { DashboardGroupRecord } from "./types";
import {
  connectUserToGroup,
  getDashboardErrorMessage,
  getGroupSuggestions,
} from "@/lib/dashboard/dashboardApi";

type SuggestedGroup = {
  id: string;
  name: string;
  about: string;
  thumbnail: string;
};

export default function GroupSuggestions() {
  const [{ userInfo }] = useStateProvider();
  const [groups, setGroups] = useState<SuggestedGroup[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const visibleGroups = useMemo(
    () => groups.filter((item) => !hiddenIds.includes(item.id)),
    [groups, hiddenIds]
  );

  useEffect(() => {
    const fetchGroups = async () => {
      if (!userInfo?.id) return;
      setIsLoading(true);
      try {
        const unassociatedGroups: DashboardGroupRecord[] =
          await getGroupSuggestions(userInfo.id);

        setGroups(
          unassociatedGroups.map((group) => ({
            id: group.id,
            name: group.name || "Untitled group",
            about: group.about || "Community group on Yome",
            thumbnail: group.thumbnail || "/avatars/groupprofile.png",
          }))
        );
        setHiddenIds([]);
      } catch (error) {
        toast.error(
          getDashboardErrorMessage(error, "Failed to load group suggestions.")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [userInfo?.id]);

  const hideCard = (id: string) => {
    setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!userInfo?.id) return;

    setPendingIds((prev) => [...prev, groupId]);
    try {
      const successMessage = await connectUserToGroup(userInfo.id, groupId);
      toast.success(successMessage || "You joined the group.");
      hideCard(groupId);
    } catch (error) {
      toast.error(
        getDashboardErrorMessage(error, "Unable to join the group.")
      );
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== groupId));
    }
  };

  if (!userInfo?.id) return null;

  return (
    <section className="rounded-xl bg-[var(--fb-card)] p-3 shadow-[var(--fb-shadow)] sm:rounded-2xl sm:p-4">
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <BsPeople className="text-base text-[var(--fb-text)] sm:text-lg md:text-xl" />
          <h3 className="text-lg font-bold text-[var(--fb-text)] sm:text-xl md:text-2xl">
            Your group suggestions
          </h3>
        </div>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--fb-muted)] hover:bg-[var(--fb-bg)] sm:h-8 sm:w-8"
          aria-label="More"
        >
          <BsThreeDots />
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-2 overflow-hidden sm:gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`group-skeleton-${index}`}
              className="min-w-[160px] rounded-xl border border-[var(--fb-divider)] bg-[var(--fb-card)] sm:min-w-[200px] sm:rounded-2xl md:min-w-[240px] lg:min-w-[260px]"
            >
              <div className="h-[100px] animate-pulse rounded-t-xl bg-[var(--fb-bg)] sm:h-[120px] sm:rounded-t-2xl md:h-[150px] lg:h-[170px]" />
              <div className="space-y-1 p-2.5 sm:space-y-1.5 sm:p-3">
                <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--fb-bg)]" />
                <div className="h-2.5 w-full animate-pulse rounded bg-[var(--fb-bg)]" />
                <div className="h-7 w-full animate-pulse rounded-lg bg-[var(--fb-bg)] sm:h-8 sm:rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="rounded-lg bg-[var(--fb-bg)] p-3 text-xs text-[var(--fb-muted)] sm:rounded-xl sm:p-4 sm:text-sm">
          No group suggestions right now.
        </div>
      ) : (
        <>
          <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-2 sm:gap-3">
            {visibleGroups.slice(0, 12).map((group, index) => (
              <article
                key={group.id}
                className="min-w-[160px] overflow-hidden rounded-xl border border-[var(--fb-divider)] bg-[var(--fb-card)] shadow-[var(--fb-shadow)] sm:min-w-[200px] sm:rounded-2xl md:min-w-[240px] lg:min-w-[260px]"
              >
                <div className="relative h-[100px] w-full bg-[var(--fb-bg)] sm:h-[120px] md:h-[150px] lg:h-[170px]">
                  <Image
                    src={group.thumbnail}
                    alt={group.name}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, (max-width: 1024px) 240px, 260px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1 p-2.5 sm:space-y-1.5 sm:p-3">
                  <h4 className="line-clamp-1 text-sm font-semibold leading-tight text-[var(--fb-text)] sm:text-base md:text-lg">
                    {group.name}
                  </h4>
                  <p className="line-clamp-2 min-h-0 text-[10px] text-[var(--fb-muted)] sm:text-xs md:text-sm">
                    {group.about}
                  </p>
                  <div className="mt-1 flex gap-1.5 sm:mt-1.5 sm:gap-2">
                    <button
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={pendingIds.includes(group.id)}
                      className="flex-1 rounded-lg bg-[var(--fb-blue)] py-1.5 text-xs font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 sm:rounded-xl sm:py-2 sm:text-sm md:text-base"
                    >
                      {pendingIds.includes(group.id) ? "Joining..." : "Join group"}
                    </button>
                    <button
                      onClick={() => hideCard(group.id)}
                      className="rounded-lg bg-[#e4e6eb] px-2.5 py-1.5 text-xs font-semibold text-[var(--fb-text)] transition hover:bg-[#d8dbe2] sm:rounded-xl sm:px-3 sm:py-2 md:px-4 md:text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {visibleGroups.length > 3 ? (
            <div className="pt-2 text-center sm:pt-3">
              <button className="text-sm font-semibold text-[var(--fb-blue)] hover:underline sm:text-base md:text-lg">
                See more groups
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
