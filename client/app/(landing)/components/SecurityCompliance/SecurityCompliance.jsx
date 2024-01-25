import React from "react";
import chooseImg from "../../../../public/assests/images/read.png";
import Image from "next/image";

const SecurityCompliance = () => {
  return (
    <section className="p-10 bg-[#0d0225]">
      <div className="container">
        <div className="flex flex-col md:flex-row">
          <div className="pt-10">
            <div className="text-white">
              <h2 className="text-5xl font-semibold">
                Built with compliance and security.
              </h2>
              <p className="text-xl font-medium mt-4 text-gray-400">
                Whether SOC 2, HIPAA, or ISO, highlight.io can work with your
                stack. Contact us at security@highlight.io for more information.
              </p>
              <button className="learn-more-btn">Read our docs</button>
            </div>
          </div>

          <div className="col-lg-6 col-md-6">
            <div className="test__img">
              <Image src={chooseImg} alt="" className="w-100" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityCompliance;
