"use client";
import React, { useState } from "react";
import { CiBookmark } from "react-icons/ci";
import Modal from "./components/Modal";
import { careers } from "./components/constants";
const CareerVisualizationPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const showModalHandler = (id) => {
    setShowModal(true);
    setActiveId(id);
  };
  return (
    <div className="p-3 relative">
      <div className="text-center flex flex-col items-center justify-center min-h-auto relative min-h-[192px] border-b border-b-gray-400 sm:min-h-[281px] transition-all">
        <div className="max-w-[600px]">
          <h2 className="text-4xl font-bold text-gray-800">
            Career Visualization
          </h2>
          <p className="text-sm font-light text-gray-400">
            This section provides roadmaps, guides and other educational content
            to help guide students in picking up a path and guide their
            learnings.
          </p>
        </div>
      </div>

      <div class="relative border-b border-b-gray-400 py-10 sm:py-14">
        <div class="container flex flex-col items-center">
          <h2 class="text-md font-regular absolute -top-[18px] flex shadow-xl  border border-gray-400 rounded-lg  bg-white px-3 py-2 text-slate-600 sm:left-1/2 sm:-translate-x-1/2">
            {" "}
            Role based Roadmaps{" "}
          </h2>
          <ul class="grid grid-cols-1 w-[800px] gap-2 sm:grid-cols-2 md:grid-cols-3">
            {careers.map((career, id) => (
              <li
                key={id}
                onClick={() => showModalHandler(career.id)}
                className="relative px-3 py-3 border border-gray-300 hover:border-sky-700 shadow-md bg-white text-lg text-gray-600 rounded-lg"
              >
                <a href="">
                  <CiBookmark className="absolute top-1 right-2 hover:text-sky-700 " />

                  <span>{career.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>{" "}
      </div>
      {showModal && <Modal setShowModal={setShowModal} activeId={activeId} />}
    </div>
  );
};
export default CareerVisualizationPage;
