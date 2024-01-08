import Image from "next/image";
import React from "react";

function Empty() {
  return (
    <div className="relative h-screen w-full">
      {/* Background image with reduced opacity */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/bgChat.jpg')",
          opacity: 0.2,
        }}
      ></div>
      <div className="absolute inset-0 bg-[#c4c4c4] opacity-20"></div>
      {/* Content with full opacity */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Your content goes here */}
        <div className="flex flex-col w-[380px] text-center items-center text-white ">
          <Image
            src="/images/messageIcon.png"
            alt="message"
            width={60}
            height={60}
          />
          <h1 className="text-2xl text-[#757575] font-bold">
            Search or Start a new Conversations.
          </h1>
        </div>
      </div>
    </div>
  );
}

export default Empty;
