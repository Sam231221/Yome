// Footer.jsx
import Image from "next/image";
import React from "react";
import { FaFacebookF } from "react-icons/fa";
import { FaLinkedinIn } from "react-icons/fa";
import { FaGithub } from "react-icons/fa6";
const footerQuickLinks = [
  {
    display: "Pricing",
    url: "#",
  },
  {
    display: "Sign up",
    url: "#",
  },
  {
    display: "Features",
    url: "#",
  },
  {
    display: "Privacy & Security",
    url: "#",
  },
  {
    display: "Customers",
    url: "#",
  },
  {
    display: "Session Replay",
    url: "#",
  },
  {
    display: "Error Monitoring",
    url: "#",
  },
  {
    display: "Error Logging",
    url: "#",
  },
];

const footerInfoLinks = [
  {
    display: "Hotjar",
    url: "#",
  },
  {
    display: "Fullstory",
    url: "#",
  },
  {
    display: "Smartlook",
    url: "#",
  },
  {
    display: "Inspectlet",
    url: "#",
  },
  {
    display: "Datadog",
    url: "#",
  },
  {
    display: "Sentry",
    url: "#",
  },
];

const Footer = () => {
  return (
    <footer className="p-2 bg-[#0d0225] text-white">
      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="mb-4">
            <div className="flex gap-2 items-center">
              <div className="w-10 h-10">
                <Image src="/logos/LogoWhiteT.png" width={100} height={100} />
              </div>
              <h2 className="flex items-center gap-1 text-2xl font-bold">
                <i className="ri-pantone-line"></i> EduroClass.
              </h2>
            </div>

            <div className="follows mt-3 ">
              <div className="flex gap-2 items-center">
                <a href="https://www.facebook.com">
                  <FaFacebookF size={25} />
                </a>
                <a href="https://www.linkedin.com">
                  <FaLinkedinIn size={25} />
                </a>
                <a href="https://github.com">
                  <FaGithub size={25} />
                </a>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h6 className="font-bold">Product</h6>
            <ul className="list-none ">
              {footerQuickLinks.map((item, index) => (
                <li key={index} className="mb-2">
                  <a href={item.url} className="text-gray-300">
                    {item.display}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h6 className="font-bold">Competitors</h6>
            <ul className="list-none">
              {footerInfoLinks.map((item, index) => (
                <li key={index} className="mb-2">
                  <a href={item.url} className="text-gray-300">
                    {item.display}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h6 className="font-bold">Get in Touch</h6>
            <ul className="list-none text-gray-300">
              <p>Address: birauta, Pokhara</p>
              <p>Phone: 9806676702</p>
              <p>Email: example@gmail.com</p>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
