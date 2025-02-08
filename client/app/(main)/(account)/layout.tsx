"use client";
import { useState, useEffect } from "react";
import { RxDashboard } from "react-icons/rx";
import { SlCompass } from "react-icons/sl";
import { CiBoxList } from "react-icons/ci";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import {
  IoMenuOutline,
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
  const [isOpen, setSideBarOpen] = useState(false);
  const toggleMenu = () => {
    setSideBarOpen(!isOpen);
  };

  const showSidebar = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth <= 640) {
        setSideBarOpen(false);
      }
    }
  };

  return (
    <div className="relative w-full">
      {/* Sidebar */}
      <div
        className={
          "hidden w-0 sm:block sm:w-[65px] h-screen navigation fixed left-0 bg-white border-white"
        }
      >
        <div className="group md:hidden mt-2 w-full gap-1 flex items-center text-white">
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
        <ul className="w-full mt-20 md:active:w-[244px]">
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

        {/* MOdal */}
        <div className={`${isOpen ? " mt-5 p-5" : "hidden"}`}>
          <div className="bg-white border rounded drop-shadow-lg px-2 py-4 flex flex-col items-center justify-end">
            <Image
              width={60}
              height={60}
              src="/images/banner.png"
              className=" object-contain"
              alt="banner"
              style={{ width: "auto" }}
            />
            <h1 className="text-sm font-bold leading-8">Unlimited Acess</h1>
            <p className="text-xs text-center text-gray-700 ">
              Upgrage href plan href get unlimited reports
            </p>
            <button className="bg-none border-[1px] border-primaryTextColor py-2 px-3 text-xs hover:bg-secondaryTextColor hover:border-none hover:text-white mt-5">
              Upgrade
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div
        className={
          "w-full block sm:absolute  sm:w-[calc(100%-65px)] left-[65px]  transition duration-500 ease-out  h-full bg-primaryBgColor"
        }
      >
        {/*Topbar */}
        <div className="topbar z-[3]  sticky top-0 bg-white w-full h-[60px] flex justify-between items-center">
          <Link href="/home">
            <div className="hidden md:flex gap-2 ml-3 items-center">
              <div className="w-10 h-10">
                <Image
                  width={40}
                  height={40}
                  loading="lazy"
                  className="w-full h-full"
                  src="/logos/LogoBlueT.png"
                />
              </div>

              <h1 className="text-gray-700 text-lg font-bold">Eduroclass</h1>
            </div>
          </Link>
          <div className="flex gap-3 items-center">
            {/* Hamburger */}
            {/* <IoMenuOutline
              onClick={toggleMenu}
              className="w-[30px] h-[30px] cursor-pointer hidden sm:block"
            /> */}
          </div>

          <div className="flex gap-4 pr-4">
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
