"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RxDashboard } from "react-icons/rx";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoSearchOutline } from "react-icons/io5";
import { MessagesDropDown } from "@/components/MessagesDropDown";
import { NotificationDropdown } from "@/components/NotificationDropDown";
import { ProfileDropDown } from "@/components/ProfileDropDown";

export default function Layout({ children }: { children: React.ReactNode }) {
  const splitLocation = usePathname();
  const isDashboard = splitLocation?.startsWith("/dashboard");

  return (
    <div className="relative w-full">
      {isDashboard ? (
        <div className="min-h-screen bg-[var(--fb-bg)]">{children}</div>
      ) : (
        <>
          {/* Sidebar */}
          <div
            className={`w-16 h-screen navigation fixed left-0 bg-white border-white`}
          >
            <div className="group md:hidden mt-2 w-full gap-1 flex items-center text-white">
              <Link className="flex p-1 items-center" href="/home">
                <Image
                  src="/logos/LogoBlueT.png"
                  width={40}
                  height={40}
                  alt="logo"
                  style={{ width: "40px", height: "40px" }}
                />
              </Link>
            </div>
            <ul className="w-full mt-20 md:active:w-[244px]">
              <li
                className={`${
                  splitLocation === "/dashboard" ? "active bg-[#EEF2FA]" : ""
                } my-2 relative group w-full rounded-tl-full rounded-bl-full hover:bg-[#EEF2FA]`}
              >
                <Link
                  href="/dashboard"
                  className={`${splitLocation === "/home" ? "active" : ""} 
                         relative group flex w-full hover:text-secondaryTextColor items-center `}
                >
                  <span className="icon relative py-3 block px-5 text-center">
                    <RxDashboard className="text-ternaryTextColor group-hover:text-secondaryTextColor text-2xl" />
                  </span>
                </Link>
              </li>

              <li
                className={`${
                  splitLocation === "/chat" ? "active bg-[#EEF2FA]" : ""
                } my-2 relative group w-full rounded-tl-full rounded-bl-full hover:bg-[#EEF2FA]`}
              >
                <Link
                  href="/chat"
                  className="relative flex w-full hover:text-blue-500 items-center"
                >
                  <span className="icon relative py-3 block px-5 text-center">
                    <IoChatbubbleEllipsesOutline className="text-ternaryTextColor group-hover:text-secondaryTextColor text-2xl" />
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Main */}
          <div
            className={`w-[calc(100%-4rem)] left-16 transition duration-500 ease-out absolute  min-h-screen bg-primaryBgColor`}
          >
            <div className="topbar z-[3]  sticky top-0 bg-white w-full h-[60px] flex justify-between items-center">
              <Link href="/home">
                <div className="hidden md:flex gap-2 ml-3 items-center">
                  <div className="w-10 h-10">
                    <Image
                      alt="logo"
                      width={40}
                      height={40}
                      loading="lazy"
                      className="w-full h-full"
                      src="/logos/LogoBlueT.png"
                    />
                  </div>

                  <h1 className="text-gray-700 text-lg font-bold">Yome</h1>
                </div>
              </Link>

              <div className="flex gap-3 items-center"></div>

              <div className="flex gap-4 pr-4">
                <IoSearchOutline className="w-[25px] h-[25px] lg:hidden cursor-pointer text-primaryTextColor" />
                <NotificationDropdown />
                <MessagesDropDown />
                <ProfileDropDown />
              </div>
            </div>

            {children}
          </div>
        </>
      )}
    </div>
  );
}
