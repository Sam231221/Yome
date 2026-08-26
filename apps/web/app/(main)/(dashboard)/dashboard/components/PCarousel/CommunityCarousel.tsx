"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { AiOutlineUsergroupAdd } from "react-icons/ai";

import Carousel from "./Carousel";
import { useStateProvider } from "@/context/StateContext";
import { CommunitySkeleton } from "@/components/Loading/Skeletons";
import {
  connectUserToGroup,
  getDashboardErrorMessage,
} from "@/lib/dashboard/dashboardApi";
import "./styles.css";

interface Community {
  id: string;
  thumbnail: string;
  name: string;
  removed?: boolean;
}

interface CommunityCarouselProps {
  communities: Community[];
  isLoading: boolean;
  hasErrors: string | null;
}

const CommunityCarousel: React.FC<CommunityCarouselProps> = ({
  communities,
  isLoading,
  hasErrors,
}) => {
  const [{ userInfo }] = useStateProvider();
  const [filteredItems, setFilteredItems] = useState<Community[]>([]);
  const [slidesLength, setSlidesLength] = useState<number>(0);
  const [items, setItems] = useState<Community[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const handleConnectClick = async (id: string) => {
    if (!userInfo?.id) return;
    try {
      const successMessage = await connectUserToGroup(userInfo.id, id);
      setItems((prevItems) =>
        prevItems.map((item) => {
          return item.id === id ? { ...item, removed: true } : item;
        })
      );
      toast.success(successMessage || "You joined the group.");
    } catch (error) {
      toast.error(getDashboardErrorMessage(error, "Unable to join the group."));
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
      <div
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
                <div
                  key={community.id}
                  className="carousel-item xs:w-full sm:w-1/3 lg:w-1/3 ml-[14px] p-3 inline-block first:ml-0 object-cover select-none "
                >
                  <div className="flex flex-col  border shadow-lg">
                    <div className="w-full h-[220px]">
                      <div className="relative h-full w-full">
                        <Image
                          src={community.thumbnail || "/avatars/avatarbg.png"}
                          alt="item"
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 33vw"
                          priority={filteredItems[0]?.id === community.id}
                          className="object-cover"
                        />
                      </div>
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
                </div>
              );
            })}
          </>
        ) : (
          <>No results</>
        )}
      </div>
    </Carousel>
  );
};

export default CommunityCarousel;
