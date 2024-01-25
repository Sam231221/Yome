import React from "react";
import PipeLogo from "../../../../public/assests/images/pipe.png"; // Replace with actual paths for other logos
import PortalLogo from "../../../../public/assests/images/portal.png";
import DriposLogo from "../../../../public/assests/images/dripos.png";
import KnockLogo from "../../../../public/assests/images/knock.png";
import HightouchLogo from "../../../../public/assests/images/hightouch.png";
import BasedashLogo from "../../../../public/assests/images/basedash.png";
import ImpiraLogo from "../../../../public/assests/images/impira.png";
import MageLogo from "../../../../public/assests/images/mage.png";
import AirplaneLogo from "../../../../public/assests/images/airplane.png";
import SecodaLogo from "../../../../public/assests/images/secoda.png";

import Image from "next/image";
const Brands = () => {
  const brands = [
    PipeLogo,
    PortalLogo,
    DriposLogo,
    KnockLogo,
    HightouchLogo,
    BasedashLogo,
    ImpiraLogo,
    MageLogo,
    AirplaneLogo,
    SecodaLogo,
  ];

  return (
    <div className="text-center bg-[#0d0225] px-6 py-20">
      <h2 className="text-5xl font-bold text-white">Our Customers</h2>
      <p className="text-gray-300 py-6">
        Highlight powers forward-thinking companies.
        <span className="more-about-btn">More about our customers →</span>
      </p>

      <div className="m-auto max-w-[1100px] ">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 items-center justify-center lg:grid-cols-5">
          {brands.map((brand, index) => (
            <CustomerBox key={index} logo={brand} />
          ))}
        </div>
      </div>
    </div>
  );
};

const CustomerBox = ({ logo }) => {
  return (
    <div className="w-full h-full ">
      <Image
        src={logo}
        width={300}
        height={100}
        className="w-[160px] object-contain m-w-full h-auto"
        alt={"Customer Logo"}
        style={{ filter: "brightness(0) invert(1)" }}
      />
    </div>
  );
};

export default Brands;
