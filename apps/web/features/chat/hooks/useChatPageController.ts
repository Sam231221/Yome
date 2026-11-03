"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import {
  ensureUserInfo,
  getUserInfoErrorMessage,
  logUserInfoLoadError,
} from "@/lib/auth/userInfo";
import { getUserById, getUserConversation, logChatConversationError } from "@/lib/chat/chatApi";
import { resolveChatKind, type ChatKind } from "@/types/chat";

export function useChatPageController() {
  const [
    { userInfo, currentChatUser, userContacts, groupContacts },
    dispatch,
  ] = useStateProvider();
  const [isUserLoading, setIsUserLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();
  const handledDeepLinkRef = useRef<string | null>(null);

  // Deep link from other pages (e.g. the Connections message button): /chat?user=<id>
  // opens a conversation with that person even if there is no history or follow yet.
  useEffect(() => {
    if (!userInfo?.id) return;
    const target = new URLSearchParams(window.location.search).get("user");
    if (!target || handledDeepLinkRef.current === target) return;
    handledDeepLinkRef.current = target;

    const targetId = Number(target);
    if (!Number.isInteger(targetId) || targetId <= 0 || targetId === userInfo.id) {
      router.replace("/chat");
      return;
    }

    void getUserById(targetId)
      .then((user) => {
        if (!user) {
          toast.error("Could not find that person.");
          return;
        }
        dispatch({
          type: reducerCases.CHANGE_CURRENT_CHAT_USER,
          user: {
            id: user.id,
            name: user.name,
            firstname: user.firstname,
            lastname: user.lastname,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            userProfile: user.userProfile,
            identifier: "user",
            chatType: "user",
          },
        });
      })
      .catch((error) => {
        logChatConversationError("open chat from deep link", error);
        toast.error("Could not open that conversation.");
      })
      .finally(() => router.replace("/chat"));
  }, [dispatch, router, userInfo?.id]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!session?.user || userInfo) return;

        const loaded = await ensureUserInfo({
          sessionUser: session.user,
          currentUserInfo: userInfo,
          dispatch,
        });

        if (!loaded && !cancelled) {
          toast.error("User not found. Please login again.");
          router.push("/login");
          return;
        }

        if (loaded && !cancelled) {
          setIsUserLoading(false);
        }
      } catch (error) {
        logUserInfoLoadError("chat page session bootstrap", error);
        if (!cancelled) {
          toast.error(
            getUserInfoErrorMessage(error, "Failed to load user information")
          );
          setIsUserLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [dispatch, router, session?.user, userInfo]);

  useEffect(() => {
    if (userInfo?.id) {
      setIsUserLoading(false);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    const getMessages = async () => {
      if (!userInfo?.id || !currentChatUser?.id) return;

      try {
        const messages = await getUserConversation({
          fromUserId: userInfo.id,
          toUserId: currentChatUser.id,
          chatType: resolveChatKind(currentChatUser) as ChatKind,
        });
        dispatch({ type: reducerCases.SET_MESSAGES, messages });
      } catch (error) {
        logChatConversationError("load active conversation", error);
      }
    };

    const activeContactExists =
      currentChatUser &&
      userInfo &&
      [...userContacts, ...groupContacts].some(
        (contact) => contact.id === currentChatUser.id
      );

    if (activeContactExists) {
      void getMessages();
    }
  }, [currentChatUser, dispatch, groupContacts, userContacts, userInfo]);

  return {
    currentChatUser,
    isUserLoading,
  };
}
