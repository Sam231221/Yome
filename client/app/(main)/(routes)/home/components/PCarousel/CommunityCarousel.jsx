"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles.css";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import Image from "next/image";
import Link from "next/link";
import Carousel from "./Carousel";
import { AiOutlineUsergroupAdd } from "react-icons/ai";
import { CONNECT_USER_TO_GROUP } from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";
import toast from "react-hot-toast";
import { CommunitySkeleton } from "@/components/Loading/Skeletons";

const CommunityCarousel = ({ communities, isLoading, hasErrors }) => {
  const [{ userInfo }] = useStateProvider();
  const [filteredItems, setFilteredItems] = useState([]);
  const [slidesLength, setSlidesLength] = useState(0);
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleConnectClick = async (id) => {
    try {
      const { data } = await axios.post(`${CONNECT_USER_TO_GROUP}`, {
        loggedInUserId: userInfo.id,
        groupIdToJoin: id,
      });
      if (data.status === 200) {
        setItems((prevItems) =>
          prevItems.map((item) => {
            return item.id === id ? { ...item, removed: true } : item;
          })
        );
        toast.success("You Joined the group.");
      }
    } catch (e) {
      toast.error(e);
    }
  };
  useEffect(() => {
    setItems(communities);
  }, [communities]);
  useEffect(() => {
    const filters = items.filter((item) => !item.removed);
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
          <div className="grid grid-cols-3">
            <CommunitySkeleton
              classname={"col-md-4 col-lg-4 col-xl-4 mb-5 mb-lg-0"}
              cards={3}
            />
          </div>
        ) : hasErrors ? (
          <div>{hasErrors}</div>
        ) : filteredItems.length > 0 ? (
          <>
            {filteredItems?.map((community) => {
              return (
                <CSSTransition
                  key={community.id}
                  timeout={500}
                  classNames="item"
                  className="carousel-item xs:w-full sm:w-1/3 lg:w-1/3 ml-[14px] p-3 inline-block first:ml-0 object-cover select-none "
                >
                  <div className="flex flex-col  border shadow-lg">
                    <div className="w-full">
                      <Image
                        src={community.thumbnail || "/avatars/avatarbg.png"}
                        alt="item"
                        width={250}
                        height={500}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div className="my-2 p-2 flex justify-between">
                      <div className="flex flex-col">
                        <Link href="/chool">
                          <h2 className="text-sm text-gray-700 font-semibold">
                            {community.name}
                          </h2>
                        </Link>
                        <div className="flex text-gray-500 font-medium gap-1">
                          <p className="text-xs">40K members</p>
                        </div>
                      </div>
                      <div
                        onClick={() => handleConnectClick(community.id)}
                        className="flex items-center rounded-sm p-1 justify-around bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium gap-1"
                      >
                        {" "}
                        <AiOutlineUsergroupAdd />
                        <button className="text-xs rounded-sm py-2 px-1 ">
                          Join
                        </button>
                      </div>
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
export default CommunityCarousel;
