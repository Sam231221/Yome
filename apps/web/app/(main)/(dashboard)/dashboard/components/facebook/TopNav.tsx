import React from "react";
import Link from "next/link";
import Image from "next/image";
import { IoSearchOutline, IoNotifications } from "react-icons/io5";
import { AiFillHome } from "react-icons/ai";
import { MdOndemandVideo } from "react-icons/md";
import { HiUsers } from "react-icons/hi";
import { BsController } from "react-icons/bs";
import { CgMenuGridO } from "react-icons/cg";
import { RiMessengerFill } from "react-icons/ri";
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

          <div className="relative flex items-center gap-2">
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
            <div className="h-10 w-10 overflow-hidden rounded-full border border-[var(--fb-divider)]">
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </div>
            {notificationsPanel}
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
