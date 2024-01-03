"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { IoMdPersonAdd } from "react-icons/io";
import Carousel from "./Carousel";

const MentorCarousel = ({ mentors }) => {
  const handleOnClickBtn = async (e, userId, userToFollowId) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === userToFollowId ? { ...items, removed: true } : item
      )
    );
    // try {

    //   // const { data } = await axios.post(
    //   //   `${CONNECT_USER_TO_MENTOR}`,
    //   //   userId,
    //   //   userToFollowId
    //   // );
    //   // if (data.status == 200) {

    //   // }
    // } catch (e) {
    //   toast.error(e);
    // }
  };
  return (
    <Carousel>
      {mentors.map((mentor, i) => {
        return (
          <div
            key={i}
            className={`${
              mentor.removed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
            }  transition-opacity carousel-item w-1/3 ml-[14px] p-3 inline-block first:ml-0 object-cover select-none `}
          >
            <div className="flex flex-col border shadow-lg">
              <Image
                src="https://scontent.fpkr1-1.fna.fbcdn.net/v/t39.30808-1/263409073_296290029023432_2548299892588902878_n.jpg?stp=c20.0.160.160a_dst-jpg_p160x160&_nc_cat=106&ccb=1-7&_nc_sid=5740b7&_nc_ohc=LzOuaZf2i2AAX9LKAvR&_nc_ht=scontent.fpkr1-1.fna&oh=00_AfCPmAQPmlVQzZhin-QQUY2ulEiFTCpDZy7ayGT2ZPFyHA&oe=65965DCA"
                alt="person"
                width={150}
                height={500}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              <Link href="/chool">
                <h2 className="text-sm mt-2 px-2 text-gray-700 font-semibold">
                  {mentor.name}
                </h2>
              </Link>
              <div className="flex mt-2 px-2 text-gray-500 font-medium gap-1">
                <p className="text-xs">40K followers</p>
              </div>
              <div
                id="mentorBtn"
                onClick={(e) => handleOnClickBtn(e, userInfo.id, mentor.id)}
                className="flex mt-2 cursor-pointer  rounded w-full items-center justify-center text-white bg-sky-600 font-medium gap-1"
              >
                {" "}
                <IoMdPersonAdd />
                <h2 className="text-xs rounded-sm py-2 px-1 ">Connect</h2>
              </div>
            </div>
          </div>
        );
      })}
    </Carousel>
  );
};
export default MentorCarousel;
