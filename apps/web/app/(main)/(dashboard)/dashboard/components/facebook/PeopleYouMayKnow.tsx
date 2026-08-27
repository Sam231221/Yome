"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { BsPeople, BsThreeDots } from "react-icons/bs";
import { IoMdPersonAdd } from "react-icons/io";
import { useStateProvider } from "@/context/StateContext";
import {
  connectUserToMentor,
  getDashboardErrorMessage,
  getPeopleSuggestions,
  type SuggestedDashboardUser,
} from "@/lib/dashboard/dashboardApi";

export default function PeopleYouMayKnow() {
  const [{ userInfo }] = useStateProvider();
  const [allSuggestions, setAllSuggestions] = useState<SuggestedDashboardUser[]>([]);
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
        const suggestions = await getPeopleSuggestions(userInfo.id);
        setAllSuggestions(suggestions);
        setHiddenIds([]);
      } catch (error) {
        toast.error(
          getDashboardErrorMessage(error, "Failed to load people suggestions.")
        );
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
      const successMessage = await connectUserToMentor(userInfo.id, id);
      toast.success(successMessage || "Friend added successfully.");
      hideCard(id);
    } catch (error) {
      toast.error(getDashboardErrorMessage(error, "Unable to add friend."));
    } finally {
      setPendingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  if (!userInfo?.id) {
    return null;
  }

  return (
    <section className="rounded-xl bg-[var(--fb-card)] p-3 shadow-[var(--fb-shadow)] sm:rounded-2xl sm:p-4">
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <BsPeople className="text-base text-[var(--fb-text)] sm:text-lg md:text-xl" />
          <h3 className="text-lg font-bold text-[var(--fb-text)] sm:text-xl md:text-2xl">
            People you may know
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
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`people-skeleton-${index}`}
              className="min-w-[130px] rounded-xl border border-[var(--fb-divider)] bg-[var(--fb-card)] sm:min-w-[160px] sm:rounded-2xl md:min-w-[190px]"
            >
              <div className="h-[100px] animate-pulse rounded-t-xl bg-[var(--fb-bg)] sm:h-[120px] sm:rounded-t-2xl md:h-[150px]" />
              <div className="space-y-1 p-2.5 sm:space-y-1.5 sm:p-3">
                <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--fb-bg)]" />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-[var(--fb-bg)]" />
                <div className="h-7 w-full animate-pulse rounded-lg bg-[var(--fb-bg)] sm:h-8 sm:rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleSuggestions.length === 0 ? (
        <div className="rounded-lg bg-[var(--fb-bg)] p-3 text-xs text-[var(--fb-muted)] sm:rounded-xl sm:p-4 sm:text-sm">
          No suggestions right now.
        </div>
      ) : (
        <>
          <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-2 sm:gap-3">
            {visibleSuggestions.slice(0, 12).map((person, index) => (
              <article
                key={person.id}
                className="relative min-w-[130px] overflow-hidden rounded-xl border border-[var(--fb-divider)] bg-[var(--fb-card)] shadow-[var(--fb-shadow)] sm:min-w-[160px] sm:rounded-2xl md:min-w-[190px]"
              >
                <button
                  onClick={() => hideCard(person.id)}
                  className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-sm leading-none text-white sm:right-2 sm:top-2 sm:h-7 sm:w-7 md:h-8 md:w-8 md:text-lg"
                  aria-label={`Hide ${person.name}`}
                >
                  x
                </button>
                <div className="relative h-[100px] w-full bg-[var(--fb-bg)] sm:h-[120px] md:h-[150px]">
                  <Image
                    src={person.profilePicture}
                    alt={person.name}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 640px) 130px, (max-width: 768px) 160px, 190px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1 p-2.5 sm:space-y-1.5 sm:p-3">
                  <h4 className="line-clamp-1 text-sm font-semibold leading-tight text-[var(--fb-text)] sm:text-base md:text-lg">
                    {person.name}
                  </h4>
                  <p className="line-clamp-1 text-[10px] text-[var(--fb-muted)] sm:text-xs md:text-sm">
                    {person.subtitle}
                  </p>
                  <button
                    onClick={() => handleAddFriend(person.id)}
                    disabled={pendingIds.includes(person.id)}
                    className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg bg-[#e7f3ff] py-1.5 text-xs font-semibold text-[var(--fb-blue)] transition hover:bg-[#dcecff] disabled:cursor-not-allowed disabled:opacity-70 sm:rounded-xl sm:py-2 sm:text-sm md:text-base"
                  >
                    <IoMdPersonAdd className="text-base sm:text-lg md:text-xl" />
                    {pendingIds.includes(person.id) ? "Adding..." : "Add friend"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {visibleSuggestions.length > 4 ? (
            <div className="pt-2 text-center sm:pt-3">
              <button className="text-sm font-semibold text-[var(--fb-blue)] hover:underline sm:text-base md:text-lg">
                See all
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
