"use client";

import { useCallback, useEffect, useState } from "react";
import { getFollowingConnections } from "@/lib/learning/learningApi";

/** Ids of the people `userId` follows. `isLoaded` stays false until the first fetch settles. */
export function useFollowingIds(userId: number | undefined) {
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof userId !== "number") {
      setIds(new Set());
      setIsLoaded(false);
      return;
    }
    let cancelled = false;
    getFollowingConnections(userId)
      .then((people) => {
        if (cancelled) return;
        setIds(new Set(people.map((person) => Number(person.id))));
        setIsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setIsLoaded(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const markFollowing = useCallback((id: number) => {
    setIds((current) => new Set(current).add(id));
  }, []);

  return { followingIds: ids, isLoaded, markFollowing };
}
