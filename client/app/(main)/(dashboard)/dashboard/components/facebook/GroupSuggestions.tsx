"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { BsPeople, BsThreeDots } from "react-icons/bs";
import { CONNECT_USER_TO_GROUP, GET_UNASSOCIATED_GROUPS } from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";

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
        const { data } = await axios.get(
          `${GET_UNASSOCIATED_GROUPS}/${userInfo.id}`
        );
        const unassociatedGroups = data?.unassociatedGroups ?? [];

        setGroups(
          unassociatedGroups.map((group: any) => ({
            id: group.id,
            name: group.name || "Untitled group",
            about: group.about || "Community group on Yome",
            thumbnail: group.thumbnail || "/avatars/groupprofile.png",
          }))
        );
        setHiddenIds([]);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.msg ||
            error?.message ||
            "Failed to load group suggestions."
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
      const { data } = await axios.post(CONNECT_USER_TO_GROUP, {
        loggedInUserId: Number(userInfo.id),
        groupIdToJoin: groupId,
      });

      if (data?.status === 200) {
        toast.success("You joined the group.");
        hideCard(groupId);
      } else {
        toast.error(data?.msg || "Unable to join the group.");
      }
    } catch (error: any) {
      const message =
        error?.response?.data ||
        error?.response?.data?.msg ||
        error?.message ||
        "Unable to join the group.";
      toast.error(typeof message === "string" ? message : "Unable to join the group.");
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== groupId));
    }
  };

  if (!userInfo?.id) return null;

  return (
    <section className="rounded-2xl bg-[var(--fb-card)] p-4 shadow-[var(--fb-shadow)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BsPeople className="text-xl text-[var(--fb-text)]" />
          <h3 className="text-2xl font-bold text-[var(--fb-text)]">
            Your group suggestions
          </h3>
        </div>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--fb-muted)] hover:bg-[var(--fb-bg)]"
          aria-label="More"
        >
          <BsThreeDots />
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`group-skeleton-${index}`}
              className="min-w-[300px] rounded-2xl border border-[var(--fb-divider)] bg-[var(--fb-card)]"
            >
              <div className="h-[220px] animate-pulse rounded-t-2xl bg-[var(--fb-bg)]" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--fb-bg)]" />
                <div className="h-3 w-full animate-pulse rounded bg-[var(--fb-bg)]" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-[var(--fb-bg)]" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="rounded-xl bg-[var(--fb-bg)] p-4 text-sm text-[var(--fb-muted)]">
          No group suggestions right now.
        </div>
      ) : (
        <>
          <div className="custom-scrollbar flex gap-4 overflow-x-auto pb-2">
            {visibleGroups.slice(0, 12).map((group) => (
              <article
                key={group.id}
                className="min-w-[300px] overflow-hidden rounded-2xl border border-[var(--fb-divider)] bg-[var(--fb-card)] shadow-[var(--fb-shadow)]"
              >
                <div className="relative h-[220px] w-full bg-[var(--fb-bg)]">
                  <Image
                    src={group.thumbnail}
                    alt={group.name}
                    fill
                    sizes="300px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <h4 className="line-clamp-1 text-[2rem] font-semibold leading-tight text-[var(--fb-text)]">
                    {group.name}
                  </h4>
                  <p className="line-clamp-2 min-h-[42px] text-base text-[var(--fb-muted)]">
                    {group.about}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={pendingIds.includes(group.id)}
                      className="flex-1 rounded-xl bg-[var(--fb-blue)] py-2.5 text-xl font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {pendingIds.includes(group.id) ? "Joining..." : "Join group"}
                    </button>
                    <button
                      onClick={() => hideCard(group.id)}
                      className="rounded-xl bg-[#e4e6eb] px-6 py-2.5 text-xl font-semibold text-[var(--fb-text)] transition hover:bg-[#d8dbe2]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {visibleGroups.length > 3 ? (
            <div className="pt-3 text-center">
              <button className="text-xl font-semibold text-[var(--fb-blue)] hover:underline">
                See more groups
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
