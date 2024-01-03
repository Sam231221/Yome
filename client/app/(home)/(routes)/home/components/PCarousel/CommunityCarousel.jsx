"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import Carousel from "./Carousel";
import { AiOutlineUsergroupAdd } from "react-icons/ai";

const CommunityCarousel = ({ communities }) => {
  return (
    <Carousel>
      {communities?.map((community, i) => {
        return (
          <div
            key={i}
            className="carousel-item w-1/3 ml-[14px] p-3 inline-block first:ml-0 object-cover select-none "
          >
            <div className="flex flex-col  border shadow-lg">
              <div className="w-full">
                <Image
                  src="https://scontent.fpkr1-1.fna.fbcdn.net/v/t39.30808-6/275467566_5092411194143979_3051949811765245018_n.jpg?stp=c0.38.1200.514a_dst-jpg_s350x350&_nc_cat=1&ccb=1-7&_nc_sid=aae68a&_nc_ohc=2c35mm8wNnYAX_G59j3&_nc_ht=scontent.fpkr1-1.fna&oh=00_AfCbMUI-WaYlQlAvqR5AP851YbGBQkqB0KtQ3-zk-meFAA&oe=6597021E"
                  alt="person"
                  width={150}
                  height={500}
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
                <div className="flex items-center rounded-sm p-1 justify-around bg-gray-300 text-gray-700 font-medium gap-1">
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
    </Carousel>
  );
};
export default CommunityCarousel;
