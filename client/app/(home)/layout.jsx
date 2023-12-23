"use client";
import { useState, useEffect } from "react";
import { FaMagento } from "react-icons/fa";
import { RxDashboard } from "react-icons/rx";
import { BsCart } from "react-icons/bs";
import {
  IoHelpOutline,
  IoMenuOutline,
  IoPeopleOutline,
  IoSearchOutline,
  IoStatsChartOutline,
  IoStatsChartSharp,
} from "react-icons/io5";

import { MessagesDropDown } from "@/components/MessagesDropDown";
import { NotificationDropdown } from "@/components/NotificationDropDown";
import { ProfileDropDown } from "@/components/ProfileDropDown";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
export default function HomeLayout({ children }) {
  const splitLocation = usePathname();
  const [isOpen, setSideBarOpen] = useState(true);
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
  useEffect(() => {
    showSidebar();

    const handleResize = () => {
      showSidebar();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  return (
    <div className="relative w-full">
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "w-[244px] " : "w-[65px]"
        } h-screen navigation fixed left-0 bg-white border-white`}
      >
        <div className="group w-full gap-1 flex items-center text-white">
          <Link className="flex p-1 items-center" href="/">
            <Image
              src="/logos/logoBlueT.png"
              width={40}
              height={40}
              alt="logo"
              style={{ width: "40px", height: "40px" }}
            />

            <span className="text-2xl text-primaryTextColor ml-2 font-bold py-3">
              Eduroclass
            </span>
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
              <span className="text-primaryTextColor group-hover:text-secondaryTextColor font-semibold relative block py-3 px-2 whitespace-nowrap text-sm">
                Overview
              </span>
            </Link>
          </li>
          <li
            className={`${
              splitLocation === "/userfeeds" ? "active bg-[#EEF2FA]" : ""
            } my-2 relative group w-full rounded-tl-full rounded-bl-full hover:bg-[#EEF2FA]`}
          >
            <Link
              href="/userfeeds"
              className="relative flex w-full hover:text-blue-500 items-center"
            >
              <span className="icon relative py-3 block px-5 text-center">
                <BsCart className="text-ternaryTextColor group-hover:text-secondaryTextColor text-2xl" />
              </span>
              <span className="text-primaryTextColor group-hover:text-secondaryTextColor font-semibold relative block py-3 px-2 whitespace-nowrap text-sm">
                Feeds
              </span>
            </Link>
          </li>
          <li
            className={`${
              splitLocation === "/explorecareer" ? "active bg-[#EEF2FA]" : ""
            }  my-2 relative group w-full rounded-tl-full rounded-bl-full hover:bg-[#EEF2FA]`}
          >
            <Link
              href="/explorecareer"
              className="relative group flex w-full hover:text-secondaryTextColor items-center"
            >
              <span className="icon relative py-3 block px-5 text-center">
                <IoStatsChartOutline className="text-ternaryTextColor group-hover:text-secondaryTextColor text-2xl" />
              </span>
              <span className="text-primaryTextColor group-hover:text-secondaryTextColor font-semibold relative block py-3 px-2 whitespace-nowrap text-sm">
                Career Explore
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
              <span className="text-primaryTextColor group-hover:text-secondaryTextColor font-semibold relative block py-3 px-2 whitespace-nowrap text-sm">
                Compare
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
                <IoStatsChartOutline className="text-ternaryTextColor group-hover:text-secondaryTextColor text-2xl" />
              </span>
              <span className="text-primaryTextColor group-hover:text-secondaryTextColor font-semibold relative block py-3 px-2 whitespace-nowrap text-sm">
                Favourites
              </span>
            </Link>
          </li>
        </ul>
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
        className={`${
          isOpen
            ? "w-[calc(100%-244px)] left-[244px]"
            : "w-[calc(100%-65px)] left-[65px] "
        } transition duration-500 ease-out absolute  min-h-screen bg-primaryBgColor`}
      >
        <div className="topbar z-10 sticky top-0 bg-white w-full h-[60px] flex justify-between items-center">
          <div className="flex gap-3 items-center">
            {/* Hamburger */}
            <IoMenuOutline
              onClick={toggleMenu}
              className="w-[30px] h-[30px] cursor-pointer hidden sm:block"
            />

            {/* SearchBar */}
            <div className="border-[1px] min-w-[300px] border-ternaryTextColor hidden lg:flex focus:border-secondaryTextColor items-center">
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
