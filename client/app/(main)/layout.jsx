"use client";
import { useState, useEffect } from "react";
import { RxDashboard } from "react-icons/rx";
import { SlCompass } from "react-icons/sl";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import {
  IoBookmarksOutline,
  IoSearchOutline,
  IoStatsChartOutline,
} from "react-icons/io5";

import { MessagesDropDown } from "@/components/MessagesDropDown";
import { NotificationDropdown } from "@/components/NotificationDropDown";
import { ProfileDropDown } from "@/components/ProfileDropDown";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
export default function HomeLayout({ children }) {
  const splitLocation = usePathname();

  return (
    <div className="relative w-full">
      {/* Sidebar */}
      <div
        className={`w-[65px] h-screen navigation fixed left-0 bg-white border-white`}
      >
        <div className="group mt-2 w-full gap-1 flex items-center text-white">
          <Link className="flex p-1 items-center" href="/home">
            <Image
              src="/logos/logoBlueT.png"
              width={40}
              height={40}
              alt="logo"
              style={{ width: "40px", height: "40px" }}
            />
          </Link>
        </div>
        <ul className="w-full mt-5 md:active:w-[244px]">
          <li
            className={`${
              splitLocation === "/home" ? "active bg-[#EEF2FA]" : ""
            } my-2 relative group w-full rounded-tl-full rounded-bl-full hover:bg-[#EEF2FA]`}
          >
            <Link
              href="/home"
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
          {/* <li
            className={`${
              splitLocation === "/userfeeds" ? "active bg-[#EEF2FA]" : ""
            } my-2 relative group w-full rounded-tl-full rounded-bl-full hover:bg-[#EEF2FA]`}
          >
            <Link
              href="/userfeeds"
              className="relative flex w-full hover:text-blue-500 items-center"
            >
              <span className="icon relative py-3 block px-5 text-center">
                <CiBoxList className="text-ternaryTextColor group-hover:text-secondaryTextColor text-2xl" />
              </span>
              <span className="text-primaryTextColor group-hover:text-secondaryTextColor font-semibold relative block py-3 px-2 whitespace-nowrap text-sm">
                Feeds
              </span>
            </Link>
          </li> */}
          <li
            className={`${
              splitLocation === "/explore" ? "active bg-[#EEF2FA]" : ""
            }  my-2 relative group w-full rounded-tl-full rounded-bl-full hover:bg-[#EEF2FA]`}
          >
            <Link
              href="/explore"
              className="relative group flex w-full hover:text-secondaryTextColor items-center"
            >
              <span className="icon relative py-3 block px-5 text-center">
                <SlCompass className="text-ternaryTextColor group-hover:text-secondaryTextColor text-2xl" />
              </span>
            </Link>
          </li>
          <li
            className={`${
              splitLocation === "/compare" ? "active bg-[#EEF2FA]" : ""
            }  my-2 relative group w-full rounded-tl-full rounded-bl-full hover:bg-[#EEF2FA]`}
          >
            <Link
              href="/compare"
              className="relative group flex w-full hover:text-secondaryTextColor items-center"
            >
              <span className="icon relative py-3 block px-5 text-center">
                <IoStatsChartOutline className="text-ternaryTextColor group-hover:text-secondaryTextColor text-2xl" />
              </span>
            </Link>
          </li>
          <li
            className={`${
              splitLocation === "/favourites" ? "active bg-[#EEF2FA]" : ""
            }  my-2 relative group w-full rounded-tl-full rounded-bl-full hover:bg-[#EEF2FA]`}
          >
            <Link
              href="/favourites"
              className="relative group flex w-full hover:text-secondaryTextColor items-center"
            >
              <span className="icon relative py-3 block px-5 text-center">
                <IoBookmarksOutline className="text-ternaryTextColor group-hover:text-secondaryTextColor text-2xl" />
              </span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Main */}
      <div
        className={`w-[calc(100%-65px)] left-[65px] transition duration-500 ease-out absolute  min-h-screen bg-primaryBgColor`}
      >
        <div className="topbar z-[3] shadow-lg sticky top-0 bg-white w-full h-[60px] flex justify-between items-center">
          <div className="flex gap-3 items-center">
            {/* SearchBar */}
            <div className="border-[1px] ml-5 min-w-[300px] border-ternaryTextColor hidden lg:flex focus:border-secondaryTextColor items-center">
              <input
                className="border-none w-full py-2 px-4 outline-none text-primaryTextColor text-sm"
                type="text"
                placeholder="Search for ..."
              />
              <IoSearchOutline className="w-[40px] h-[40px] py-2 px-2 cursor-pointer text-primaryTextColor" />
            </div>
          </div>

          <div className="flex gap-4 pr-4">
            <IoSearchOutline className="w-[25px] h-[25px] lg:hidden cursor-pointer text-primaryTextColor" />
            <NotificationDropdown />
            <MessagesDropDown />
            <ProfileDropDown />
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
