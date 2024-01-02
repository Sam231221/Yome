import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { IoMdPersonAdd } from "react-icons/io";
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

const PeopleSlider = () => {
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
          ? productsp.map((product, i) => {
              return (
                <div key={i} className="flex flex-col border shadow-lg">
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
                  <div className="flex flex-col p-3 my-2">
                    <Link href="/chool">
                      <h2 className="text-sm text-gray-700 font-semibold">
                        Nepali Codes
                      </h2>
                    </Link>
                    <div className="flex text-gray-500 font-medium gap-1">
                      <p className="text-xs">40K followers</p>
                    </div>
                    <div className="flex mt-2 rounded w-full items-center justify-center text-white bg-sky-400 font-medium gap-1">
                      {" "}
                      <IoMdPersonAdd />
                      <button className="text-xs rounded-sm py-2 px-1 ">
                        Connect
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
export default PeopleSlider;
