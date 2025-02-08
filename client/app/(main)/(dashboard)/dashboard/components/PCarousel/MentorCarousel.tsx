"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { TransitionGroup, CSSTransition } from "react-transition-group";

import { IoMdPersonAdd } from "react-icons/io";
import Carousel from "./Carousel";
import "./styles.css";

import { useStateProvider } from "@/context/StateContext";

import { CONNECT_USER_TO_MENTOR } from "@/utils/ApiRoutes";
import { MentorSkeleton } from "@/components/Loading/Skeletons";
const MentorCarousel = ({ mentors, isLoading, hasErrors }) => {
  const [{ userInfo }] = useStateProvider();
  const [filteredItems, setFilteredItems] = useState([]);
  const [slidesLength, setSlidesLength] = useState(0);
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleConnectClick = async (id) => {
    try {
      const { data } = await axios.post(`${CONNECT_USER_TO_MENTOR}`, {
        loggedInUserId: userInfo.id,
        mentorId: id,
      });

      if (data.status === 200) {
        setItems((prevPeople) =>
          prevPeople.map((person) => {
            return person.id === id ? { ...person, removed: true } : person;
          })
        );
        toast.success("You followed the user.");
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    setItems(mentors);
  }, [mentors]);
  useEffect(() => {
    const filters = items.filter((person) => !person.removed);
    setSlidesLength(filters.length);
    setFilteredItems(filters);
  }, [items]);
  return (
    <Carousel>
      <TransitionGroup
        className="carousel-wrapper"
        style={{
          transform: `translateX(-${activeIndex * (100 / slidesLength)}%)`,
        }}
      >
        {isLoading ? (
          <div className="grid grid-cols-4">
            <MentorSkeleton
              classname={"col-md-4 col-lg-4 col-xl-4 mb-5 mb-lg-0"}
              cards={4}
            />
          </div>
        ) : hasErrors ? (
          <div>{hasErrors}</div>
        ) : filteredItems.length > 0 ? (
          <>
            {filteredItems.map((mentor) => {
              return (
                <CSSTransition
                  key={mentor.id}
                  timeout={500}
                  classNames="item"
                  className={`carousel-item xs:w-full sm:w-1/3 lg:w-1/4 ml-[14px] p-3 inline-block first:ml-0 object-cover select-none `}
                >
                  <div className="flex flex-col border shadow-lg">
                    <div className="w-full h-[200px]">
                      <Image
                        src={mentor.profilePicture || "/avatars/avatarbg.png"}
                        alt="person"
                        width={500}
                        height={500}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>

                    <Link href="/chool">
                      <h2 className="text-sm mt-2 px-2 text-gray-700 font-semibold">
                        {mentor.firstname} {mentor.lastname}
                      </h2>
                    </Link>
                    <div className="flex mt-2 px-2 text-gray-500 font-medium gap-1">
                      <p className="text-xs">40K followers</p>
                    </div>
                    <div
                      id="mentorBtn"
                      onClick={() => handleConnectClick(mentor.id)}
                      className="flex mt-2 cursor-pointer  rounded w-full items-center justify-center text-white bg-sky-600 hover:bg-sky-700 font-medium gap-1"
                    >
                      {" "}
                      <IoMdPersonAdd />
                      <h2 className="text-xs rounded-sm py-2 px-1 ">Connect</h2>
                    </div>
                  </div>
                </CSSTransition>
              );
            })}
          </>
        ) : (
          <>No results</>
        )}
      </TransitionGroup>
    </Carousel>
  );
};
export default MentorCarousel;
