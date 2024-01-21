import React, { useEffect, useRef, useState } from "react";
import { RxTriangleDown } from "react-icons/rx";
import {
  BsBoxArrowRight,
  BsGear,
  BsPerson,
  BsQuestionCircle,
  BsCardText,
} from "react-icons/bs";

import Image from "next/image";
import { useStateProvider } from "@/context/StateContext";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
export const ProfileDropDown = () => {
  const router = useRouter();
  const [{ userInfo, socket }, dispatch] = useStateProvider();
  const [open, setOpen] = useState(false);
  let ProfileHeadRef = useRef();
  let ProfileBodyRef = useRef();

  useEffect(() => {
    let handler = (e) => {
      if (
        !ProfileHeadRef.current.contains(e.target) &&
        !ProfileBodyRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  });
  const handleSignOut = () => {
    signOut();
    if (socket.current) {
      socket.current.emit("signout", userInfo.id);
    }
    router.push("/login");
  };
  return (
    <>
      <div
        className="flex items-center relative"
        ref={ProfileHeadRef}
        onClick={() => {
          setOpen(!open);
        }}
      >
        <div className="w-9 h-9 bg-white shadow-lg rounded-full">
          <Image
            width={300}
            height={300}
            loading="lazy"
            src={`${userInfo?.profilePicture || "/avatars/userprofile.png"}`}
            className="rounded-full w-full h-full object-cover"
            alt="userprofile"
          />
        </div>
        <span className="ml-2 font-semibold hidden md:block text-primaryTextColor cursor-pointer text-xs">
          Mr {userInfo?.lastname}
        </span>
        <RxTriangleDown className="text-secondaryTextColor" />
      </div>

      <div
        ref={ProfileBodyRef}
        className={` ${
          open ? "absolute" : "hidden"
        } before:content-[""] before:border-bg-[#eaedf1] before:border-t-[1px] 
                            before:border-l-[1px] before:absolute before:top-[-10px] before:right-5 before:h-5 before:w-5
                            before:bg-white before:rotate-[45deg] border
                           top-14 right-[2px] bg-white drop-shadow-lg w-[220px] p-3`}
      >
        <div className="mt-1  mx-2">
          <div className="flex gap-2">
            <h2 className="text-lg text-gray-800 font-medium">
              {userInfo?.firstname}
            </h2>
            <span className=" px-3 py-1 text-gray-600 rounded-3xl border-2 border-sky-600 font-medium text-xs bg-sky-300 bg-opacity-30">
              {userInfo?.role}
            </span>
          </div>
          <p className="text-xs mt-1 text-gray-600">{userInfo?.email}</p>
        </div>
        <hr />
        <ul>
          <li>
            <a
              className="px-3 py-2 bg-none hover:bg-secondaryBgColor transition-all duration-500 ease-out flex items-center gap-2 text-xs"
              href="/account"
            >
              <BsPerson /> My profile
            </a>
          </li>
          <li>
            <a
              className="px-3 py-2 bg-none hover:bg-secondaryBgColor transition-all duration-500 ease-out flex items-center gap-2 text-xs"
              href="/settings"
            >
              <BsGear /> Acccount Setting
            </a>
          </li>

          {userInfo?.role === "AGENT" && (
            <li>
              <a
                className="px-3 py-2 bg-none hover:bg-secondaryBgColor transition-all duration-500 ease-out flex items-center gap-2 text-xs"
                href="/dashboard"
              >
                <BsCardText /> Go to Dashboard
              </a>
            </li>
          )}
          <li>
            <a
              className="px-3 py-2 bg-none hover:bg-secondaryBgColor transition-all duration-500 ease-out flex items-center gap-2 text-xs"
              href="/help"
            >
              <BsQuestionCircle /> Need Help?
            </a>
          </li>
          <li className="cursor-pointer" onClick={() => handleSignOut()}>
            <span className="px-3 py-2 bg-none hover:bg-secondaryBgColor transition-all duration-500 ease-out flex items-center gap-2 text-xs">
              {" "}
              <BsBoxArrowRight /> Sign Out
            </span>
          </li>
        </ul>
        <label
          htmlFor="check"
          className="bg-gray-200 cursor-pointer relative w-16 h-8 rounded-full border drop-shadow-sm"
        >
          <input type="checkbox" id="check" className="sr-only peer" />
          <span className="w-2/5 h-3/4 bg-white absolute rounded-full left-1 top-1 peer-checked:bg-rose-600 peer-checked:left-9 transition-all duration-500"></span>
        </label>
      </div>
    </>
  );
};
