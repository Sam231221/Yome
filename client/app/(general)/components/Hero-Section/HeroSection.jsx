import React from "react";
import { FaPlay } from "react-icons/fa";
const HeroSection = () => {
  return (
    <section className="hero-section bg-[#0d0225] flex flex-col items-center justify-center text-center w-full h-screen">
      <div className=" text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight  text-white">
          <span className="whitespace-nowrap">A Saas Platform for</span>{" "}
          <span className="whitespace-nowrap  text-yellow-500">
            Centrailizing Education
          </span>
        </h2>
      </div>
      <div className="buttons flex gap-4 md:pl-10 lg:pl-16 mt-3 mb-12">
        <button className="btn-get-started bg-blue-500 text-black font-bold px-9 py-3 rounded transition duration-300 hover:bg-violet-500 hover:text-white">
          Get Started
        </button>
        <button className="btn-live-demo flex items-center border border-white text-white font-bold rounded cursor-pointer transition duration-300 px-9 py-3 hover:bg-pink-500 hover:text-black">
          <FaPlay />
          <span className="ml-2"> Live Demo</span>
        </button>
      </div>
      <button className="bg-back text-white px-2 py-2 mb-7 font-bold rounded cursor-pointer  transition duration-300  hover:bg-indigo-900">
        <p className="mr-2 mb-0">Request a Demo Call</p>
        <span className="arrow-icon text-white text-1.5rem">→</span>
      </button>
    </section>
  );
};

export default HeroSection;
