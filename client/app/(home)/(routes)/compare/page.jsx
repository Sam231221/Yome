"use client";
import Image from "next/image";
const Compare = () => {
  return (
    <div className="p-8">
      <div className="bg-white rounded-xl shadow-sm">
        <input
          className="p-3 focus:outline-none  h-[60px] text-sm text-gray-600 w-full"
          type="text"
          placeholder="Search for a Educational institution..."
        />
      </div>
      <div className="bg-white w-full mt-3 rounded-xl shadow-sm">
        <div className="w-full h-[450px] flex flex-col justify-center items-center">
          <Image
            src="/icon-info.svg"
            alt="SVG Image"
            width={100}
            height={100}
          />
          <h2 className="text-gray-800 text-lg font-semibold">
            Start Typing...
          </h2>
          <p className="text-gray-600 ">
            You can search for a Educational Institution and start comparing it
            with multiple educational institutions.{" "}
          </p>
        </div>
      </div>
    </div>
  );
};
export default Compare;
