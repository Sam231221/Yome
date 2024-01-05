import Image from "next/image";
import React from "react";
import { FaQuoteLeft, FaQuoteRight } from "react-icons/fa";
const SucessStories = () => {
  return (
    <div className="p-3">
      <div className="section-title mt-2">
        <h2 className="text-ternaryTextColor">Stories</h2>
        <p className="text-primaryTextColor">Success Stories</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="bg-white p-3 rounded-lg shadow-lg">
          <div className="flex gap-3 items-center">
            <div className="w-15 w-15">
              <Image
                width={50}
                height={50}
                src="https://bootstrapmade.com/demo/templates/Impact/assets/img/testimonials/testimonials-3.jpg"
                className="rounded-full flex-shrink-0"
                alt="avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            <div className="ml-2">
              <h3 className="text-xl font-bold text-gray-800">Matt Brandon</h3>
              <h4 className="text-xs text-gray-400 font-medium">
                Software Engineer At TechSoft Pvt Ltd
              </h4>
              <div className="stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
              </div>
            </div>
          </div>
          <p className="font-light text-sm italic mt-4">
            <FaQuoteLeft className="text-[#4254F0] inline-block relative top-[-5px] left-[-5px]" />
            Fugiat enim eram quae cillum dolore dolor amet nulla culpa multos
            export minim fugiat minim velit minim dolor enim duis veniam ipsum
            anim magna sunt elit fore quem dolore. Lorem ipsum dolor, sit amet
            consectetur adipisicing elit. Quibusdam corporis, sequi rerum vel
            modi corrupti exercitationem error consequuntur sint repudiandae
            facere dicta enim. Corporis, quibusdam? Numquam debitis asperiores
            excepturi! Officiis libero possimus molestiae ullam adipisci aliquam
            vero, quae vitae at delectus. Optio repudiandae minus impedit
            ratione maiores praesentium illo molestias. Aperiam, est sunt?
            Quidem ea, facere dolore quaerat pariatur quos.
            <FaQuoteRight className="text-[#4254F0] inline-block relative top-2 right-[-5px]" />
          </p>
        </div>
      </div>
    </div>
  );
};
export default SucessStories;
