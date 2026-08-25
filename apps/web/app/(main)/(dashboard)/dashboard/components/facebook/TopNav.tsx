"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { IoSearchOutline, IoNotifications } from "react-icons/io5";
import { AiFillHome } from "react-icons/ai";
import { MdOndemandVideo } from "react-icons/md";
import { HiUsers } from "react-icons/hi";
import { BsController } from "react-icons/bs";
import { CgMenuGridO } from "react-icons/cg";
import { RiMessengerFill } from "react-icons/ri";
import { BsBoxArrowRight, BsGear, BsKey, BsPersonCircle } from "react-icons/bs";
import { UserLite } from "./types";

const primaryNav = [
  { id: "home", icon: AiFillHome, active: true },
  { id: "video", icon: MdOndemandVideo },
  { id: "groups", icon: HiUsers },
  { id: "gaming", icon: BsController },
];

export default function TopNav({
  user,
  onToggleNotifications,
  notificationsOpen = false,
  notificationButtonRef,
  notificationsPanel,
}: {
  user: UserLite;
  onToggleNotifications?: () => void;
  notificationsOpen?: boolean;
  notificationButtonRef?: React.Ref<HTMLButtonElement>;
  notificationsPanel?: React.ReactNode;
}) {
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const closeProfileMenu = () => setProfileMenuOpen(false);
  const profileActions = [
    {
      id: "profile",
      label: "Profile & details",
      description: "Update photo, username, and personal info",
      href: "/account?tab=general",
      icon: BsPersonCircle,
    },
    {
      id: "security",
      label: "Password & security",
      description: "Change your password and review account access",
      href: "/account?tab=security",
      icon: BsKey,
    },
    {
      id: "settings",
      label: "Account settings",
      description: "Manage the broader account experience",
      href: "/account?tab=general",
      icon: BsGear,
    },
  ];

  const handleSignOut = async () => {
    closeProfileMenu();
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-[var(--fb-card)] shadow-[var(--fb-shadow)]">
      <div className="mx-auto max-w-[1280px] px-3 sm:px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fb-blue)] text-lg font-bold text-white">
                f
              </div>
            </Link>
            <div className="hidden items-center gap-2 rounded-full bg-[var(--fb-bg)] px-3 py-2 text-[var(--fb-muted)] md:flex">
              <IoSearchOutline className="text-base" />
              <input
                type="text"
                placeholder="Search Facebook"
                className="w-44 bg-transparent text-xs text-[var(--fb-text)] outline-none placeholder:text-[var(--fb-muted)]"
              />
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fb-bg)] text-[var(--fb-text)] md:hidden">
              <IoSearchOutline />
            </button>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`flex h-12 w-20 items-center justify-center rounded-xl text-xl transition hover:bg-[var(--fb-bg)] ${
                    item.active
                      ? "text-[var(--fb-blue)]"
                      : "text-[var(--fb-muted)]"
                  }`}
                >
                  <Icon />
                </button>
              );
            })}
          </div>

          <div className="relative flex items-center gap-2" ref={profileMenuRef}>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fb-bg)] text-[var(--fb-text)]">
              <CgMenuGridO />
            </button>
            <Link
              href="/chat"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fb-bg)] text-[var(--fb-text)]"
              aria-label="Open Messenger"
            >
              <RiMessengerFill />
            </Link>
            <button
              ref={notificationButtonRef}
              onClick={onToggleNotifications}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fb-bg)] text-[var(--fb-text)] ${
                notificationsOpen ? "ring-2 ring-[var(--fb-blue)]" : ""
              }`}
              aria-label="Open notifications"
            >
              <IoNotifications />
            </button>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((previous) => !previous)}
              className={`relative h-10 w-10 overflow-hidden rounded-full border transition ${
                profileMenuOpen
                  ? "border-[var(--fb-blue)] ring-2 ring-[var(--fb-blue)]/20"
                  : "border-[var(--fb-divider)]"
              }`}
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              aria-label="Open profile menu"
            >
              <Image
                src={user.avatarUrl || "/avatars/userprofile.png"}
                alt={user.name}
                fill
                sizes="40px"
                priority
                className="object-cover"
              />
            </button>
            {notificationsPanel}
            {profileMenuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-30 bg-black/10 lg:hidden"
                  aria-label="Close profile menu"
                  onClick={closeProfileMenu}
                />
                <div className="absolute right-0 top-14 z-40 w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-[var(--fb-divider)] bg-[var(--fb-card)] shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                  <div className="border-b border-[var(--fb-divider)] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[var(--fb-divider)]">
                        <Image
                          src={user.avatarUrl || "/avatars/userprofile.png"}
                          alt={user.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--fb-text)]">
                          {user.name}
                        </p>
                        {user.username && (
                          <p className="truncate text-xs text-[var(--fb-muted)]">
                            @{user.username}
                          </p>
                        )}
                        {user.email && (
                          <p className="truncate text-xs text-[var(--fb-muted)]">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    {profileActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Link
                          key={action.id}
                          href={action.href}
                          onClick={closeProfileMenu}
                          className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-[var(--fb-bg)]"
                        >
                          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--fb-bg)] text-[var(--fb-text)]">
                            <Icon className="text-base" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-[var(--fb-text)]">
                              {action.label}
                            </span>
                            <span className="block text-xs text-[var(--fb-muted)]">
                              {action.description}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="mt-1 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[var(--fb-bg)]"
                    >
                      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--fb-bg)] text-[var(--fb-text)]">
                        <BsBoxArrowRight className="text-base" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[var(--fb-text)]">
                          Sign out
                        </span>
                        <span className="block text-xs text-[var(--fb-muted)]">
                          End this session and return to login
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pb-2 lg:hidden">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={`${item.id}-mobile`}
                className={`flex h-11 flex-1 items-center justify-center rounded-xl text-lg transition hover:bg-[var(--fb-bg)] ${
                  item.active
                    ? "text-[var(--fb-blue)]"
                    : "text-[var(--fb-muted)]"
                }`}
              >
                <Icon />
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
