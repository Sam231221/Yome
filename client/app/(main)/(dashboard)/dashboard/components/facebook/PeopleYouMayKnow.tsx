"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { BsPeople, BsThreeDots } from "react-icons/bs";
import { IoMdPersonAdd } from "react-icons/io";
import {
  CONNECT_USER_TO_MENTOR,
  GET_ALL_CONNECTED_USERS,
  GET_ALL_USERS,
  GET_UNFOLLOWED_MENTORS,
} from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";

type SuggestedUser = {
  id: number;
  name: string;
  subtitle: string;
  profilePicture: string;
};

export default function PeopleYouMayKnow() {
  const [{ userInfo }] = useStateProvider();
  const [allSuggestions, setAllSuggestions] = useState<SuggestedUser[]>([]);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const visibleSuggestions = useMemo(
    () => allSuggestions.filter((item) => !hiddenIds.includes(item.id)),
    [allSuggestions, hiddenIds]
  );

  useEffect(() => {
    const fetchPeople = async () => {
      if (!userInfo?.id) return;

      setIsLoading(true);
      try {
        const followedResponse = await axios.get(
          `${GET_ALL_CONNECTED_USERS}/${userInfo.id}`
        );
        const followedUsers = followedResponse.data?.followedUsers ?? [];

        const followedSet = new Set<number>(followedUsers.map((u: any) => u.id));
        const currentUserId = Number(userInfo.id);

        let users: any[] = [];
        try {
          const allUsersResponse = await axios.get(GET_ALL_USERS);
          users = allUsersResponse.data?.users ?? [];
        } catch {
          const mentorsResponse = await axios.get(
            `${GET_UNFOLLOWED_MENTORS}/${userInfo.id}`
          );
          users = mentorsResponse.data?.mentorsNotFollowed ?? [];
        }

        const suggestions: SuggestedUser[] = users
          .filter((u: any) => u.id !== currentUserId && !followedSet.has(u.id))
          .map((u: any) => ({
            id: u.id,
            name:
              [u.firstname, u.lastname].filter(Boolean).join(" ").trim() ||
              u.name ||
              u.username ||
              "Unknown user",
            subtitle: u.role ? `${u.role.toLowerCase()} on Yome` : "Yome user",
            profilePicture: u.profilePicture || "/avatars/userprofile.png",
          }));

        setAllSuggestions(suggestions);
        setHiddenIds([]);
      } catch (error: any) {
        const message =
          error?.response?.data?.msg ||
          error?.message ||
          "Failed to load people suggestions.";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPeople();
  }, [userInfo?.id]);

  const hideCard = (id: number) => {
    setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleAddFriend = async (id: number) => {
    if (!userInfo?.id) return;

    setPendingIds((prev) => [...prev, id]);
    try {
      const { data } = await axios.post(CONNECT_USER_TO_MENTOR, {
        loggedInUserId: Number(userInfo.id),
        mentorId: id,
      });

      if (data?.status === 200) {
        toast.success("Friend added successfully.");
        hideCard(id);
      } else {
        toast.error(data?.msg || "Unable to add friend.");
      }
    } catch (error: any) {
      const message =
        error?.response?.data ||
        error?.response?.data?.msg ||
        error?.message ||
        "Unable to add friend.";
      toast.error(typeof message === "string" ? message : "Unable to add friend.");
    } finally {
      setPendingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  if (!userInfo?.id) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-[var(--fb-card)] p-4 shadow-[var(--fb-shadow)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BsPeople className="text-xl text-[var(--fb-text)]" />
          <h3 className="text-2xl font-bold text-[var(--fb-text)]">
            People you may know
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
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`people-skeleton-${index}`}
              className="min-w-[230px] rounded-2xl border border-[var(--fb-divider)] bg-[var(--fb-card)]"
            >
              <div className="h-[220px] animate-pulse rounded-t-2xl bg-[var(--fb-bg)]" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--fb-bg)]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--fb-bg)]" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-[var(--fb-bg)]" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleSuggestions.length === 0 ? (
        <div className="rounded-xl bg-[var(--fb-bg)] p-4 text-sm text-[var(--fb-muted)]">
          No suggestions right now.
        </div>
      ) : (
        <>
          <div className="custom-scrollbar flex gap-4 overflow-x-auto pb-2">
            {visibleSuggestions.slice(0, 12).map((person) => (
              <article
                key={person.id}
                className="relative min-w-[230px] overflow-hidden rounded-2xl border border-[var(--fb-divider)] bg-[var(--fb-card)] shadow-[var(--fb-shadow)]"
              >
                <button
                  onClick={() => hideCard(person.id)}
                  className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-3xl leading-none text-white"
                  aria-label={`Hide ${person.name}`}
                >
                  x
                </button>
                <div className="relative h-[220px] w-full bg-[var(--fb-bg)]">
                  <Image
                    src={person.profilePicture}
                    alt={person.name}
                    fill
                    sizes="230px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <h4 className="line-clamp-1 text-[2rem] font-semibold leading-tight text-[var(--fb-text)]">
                    {person.name}
                  </h4>
                  <p className="line-clamp-1 text-base text-[var(--fb-muted)]">
                    {person.subtitle}
                  </p>
                  <button
                    onClick={() => handleAddFriend(person.id)}
                    disabled={pendingIds.includes(person.id)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e7f3ff] py-2.5 text-xl font-semibold text-[var(--fb-blue)] transition hover:bg-[#dcecff] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <IoMdPersonAdd className="text-2xl" />
                    {pendingIds.includes(person.id) ? "Adding..." : "Add friend"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {visibleSuggestions.length > 4 ? (
            <div className="pt-3 text-center">
              <button className="text-xl font-semibold text-[var(--fb-blue)] hover:underline">
                See all
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
