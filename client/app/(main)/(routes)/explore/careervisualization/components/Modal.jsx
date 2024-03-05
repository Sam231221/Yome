import React from "react";
import { careers } from "./constants";
const Modal = ({ activeId, setShowModal }) => {
  const career = careers.find((career) => career.id === activeId);
  return (
    <div className="w-full h-full fixed top-0 left-0 z-[100] bg-[#3232326b] bg-opacity-40">
      <div className="w-11/12 md:max-w-[600px] h-[90vh] overflow-auto  md:w-full absolute top-1/2 left-1/2 z-20 bg-white rounded-[8px] tansform -translate-x-1/2 -translate-y-1/2 p-5">
        <div
          style={{
            backgroundImage: `url(${career.image})`,
          }}
          className="career-img
          "
        >
          <a
            href={career.fileUrl}
            rel="noreferrer"
            target="_blank"
            className="btn-visit"
          >
            Visit
          </a>
        </div>
        <div>
          <h2 className="text-2xl text-headingColor font-[700] my-2">
            {career.title}
          </h2>
          <p className="text-[15px] leading-7 text-smallTextColor">
            {career.description}
          </p>
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            <h4 className="text-headingColor text-[18px] text-[700]">
              Categories:
            </h4>
            {career.categories.map((item, index) => (
              <span
                key={index}
                className="bg-gray-200 py-1 px-2 m-2 rounded-[5px] text-[14px] leading-0"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowModal(false)}
          className="w-[2.2rem] h-[2.2rem]  absolute top-0 right-0 text-[48px] flex items-center justify-center rounded-[3px] leading-0 cursor-pointer"
        >
          &times;
        </button>
      </div>
    </div>
  );
};
export default Modal;
