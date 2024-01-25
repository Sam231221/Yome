import React from "react";
import chooseImg from "../../../../public/assests/images/cards.png";
import Image from "next/image";

const Courses = () => {
  return (
    <section className="p-10 bg-[#0d0225]">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="w-full h-full">
            <Image
              src={chooseImg}
              alt="courses"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="col-lg-6 col-md-6">
            <div className="text-white">
              <h2 className="text-5xl font-semibold">
                A cohesive view of your entire stack.
              </h2>
              <p className="text-xl font-medium mt-4 text-gray-400">
                A natural pairing between your errors, session replay, logs and
                more. Understand the “what”, “why” and “how” of your full-stack
                web application
              </p>
              <button className="learn-more-btn">Get started for free</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Courses;
