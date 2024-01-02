import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { AiOutlineUsergroupAdd } from "react-icons/ai";
import "owl.carousel/dist/assets/owl.carousel.css";
import "owl.carousel/dist/assets/owl.theme.default.css";
import { productsp } from "./constants";
var $ = require("jquery");
if (typeof window !== "undefined") {
  window.$ = window.jQuery = require("jquery");
}

const OwlCarousel = dynamic(() => import("react-owl-carousel"), {
  ssr: false,
});

const GroupSlider = () => {
  const options = {
    margin: 30,
    responsiveClass: true,
    nav: true,
    dots: true,
    autoplay: false,
    smartSpeed: 1000,
    navClass: ["owl-prev", "owl-next"],
    navText: ["", ""],
    responsive: {
      0: {
        items: 1,
      },
      400: {
        items: 1,
      },
      600: {
        items: 2,
      },
      700: {
        items: 3,
      },
      1000: {
        items: 4,
      },
    },
  };

  return (
    <>
      <OwlCarousel
        className="owl-theme"
        loop
        margin={4}
        nav={true}
        navText={[
          '<img src="/images/arrowleft.png" />',
          '<img src="/images/arrowright.png" />',
        ]}
        dots={false}
        animateIn={true}
        {...options}
      >
        {productsp && productsp.length > 0
          ? productsp.map((product,i) => {
              return (
                <div key={i} className="flex flex-col border shadow-lg">
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
                  <div className="my-2 p-2 flex justify-between">
                    <div className="flex flex-col">
                      <Link href="/chool">
                        <h2 className="text-sm text-gray-700 font-semibold">
                          Nepali Codes
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
              );
            })
          : ""}
      </OwlCarousel>
    </>
  );
};
export default GroupSlider;
