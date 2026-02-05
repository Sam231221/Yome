"use client";
import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { GET_USER_ROUTE } from "@/utils/ApiRoutes";
import DashboardShell from "./components/facebook/DashboardShell";
import ComposerCard from "./components/facebook/ComposerCard";
import { UserLite } from "./components/facebook/types";

function TraySkeleton() {
  return (
    <div className="rounded-2xl bg-[var(--fb-card)] p-3 shadow-[var(--fb-shadow)]">
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`tray-skeleton-${index}`}
            className="h-44 min-w-[120px] animate-pulse rounded-2xl bg-[var(--fb-bg)]"
          />
        ))}
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={`feed-skeleton-${index}`}
          className="rounded-2xl bg-[var(--fb-card)] p-4 shadow-[var(--fb-shadow)]"
        >
          <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--fb-bg)]" />
          <div className="mt-3 h-56 animate-pulse rounded-2xl bg-[var(--fb-bg)]" />
        </div>
      ))}
    </div>
  );
}

const StoriesTray = dynamic(
  () => import("./components/facebook/StoriesTray"),
  {
    loading: () => <TraySkeleton />,
  }
);
const ReelsTray = dynamic(() => import("./components/facebook/ReelsTray"), {
  loading: () => <TraySkeleton />,
});
const Feed = dynamic(() => import("./components/facebook/Feed"), {
  loading: () => <FeedSkeleton />,
});

const Home = () => {
  const [{ userInfo }, dispatch] = useStateProvider();
  const { data: session } = useSession();

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        if (session?.user && !userInfo) {
          const { data } = await axios.post(GET_USER_ROUTE, {
            email: session?.user.email,
          });
          dispatch({
            type: reducerCases.SET_USER_INFO,
            userInfo: {
              id: data?.user?.id,
              role: data?.user?.role,
              email: data?.user?.email,
              name: data?.user?.name,
              username: data?.user?.username,
              firstname: data?.user?.firstname,
              lastname: data?.user?.lastname,
              userProfile: data?.user?.userProfile,
              identifier: data?.user?.identifier,
              profilePicture: data?.user?.profilePicture,
              status: data?.user?.about,
            },
          });
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to load user information.";
        toast.error(message);
      }
    };

    getUserInfo();
  }, [session, userInfo, dispatch]);

  const fullName = userInfo?.firstname
    ? `${userInfo.firstname} ${userInfo.lastname ?? ""}`.trim()
    : userInfo?.name || session?.user?.name || "Friend";

  const user: UserLite = {
    name: fullName,
    avatarUrl:
      userInfo?.profilePicture ||
      session?.user?.image ||
      "/avatars/userprofile.png",
  };

  return (
    <DashboardShell user={user}>
      <div className="space-y-4">
        <ComposerCard user={user} />
        <StoriesTray user={user} />
        <ReelsTray />
        <Feed />
      </div>
    </DashboardShell>
  );
};

export default Home;
