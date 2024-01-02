"use client";
import Image from "next/image";
import Link from "next/link";

import { CiLocationOn } from "react-icons/ci";
import GroupSlider from "./components/Carousel/GroupSlider";
import PeopleSlider from "./components/Carousel/PeopleSlider";
const Dashboard = () => {
  return (
    <div className="p-5">
      {/* Educational Consultancies */}
      <div className="bg-white p-4  rounded-lg">
        <div className="mb-5 flex justify-between">
          <div>
            <h2 className="text-primaryTextColor font-semibold text-xl">
              Educational Instituions
            </h2>
            <p className="text-ternaryTextColor font-bold  text-xs">
              Home / <span className="text-forteryTextColor ">Dashboard</span>
            </p>
          </div>

          <div class="text-sm flex items-center gap-3">
            <span class="ml-1">Filter:</span>
            <select class=" focus:outline-none border-[1px] focus:border-secondaryTextColor">
              <option value="">----</option>
              <option value="School">School</option>
              <option value="High School">High School</option>
              <option value="College">College</option>
              <option value="Educational Consultancy">
                Educational Consultancy
              </option>
            </select>
          </div>
        </div>

        <div className="bg-white grid grid-cols-3 gap-3">
          <div className="flex flex-col border shadow-lg">
            <Image
              src="https://scontent.fpkr1-1.fna.fbcdn.net/v/t39.30808-6/326699899_1421405765266861_1947129098856942635_n.jpg?stp=dst-jpg_s960x960&_nc_cat=109&ccb=1-7&_nc_sid=783fdb&_nc_ohc=dl5WFy4AItcAX_7r_eC&_nc_ht=scontent.fpkr1-1.fna&oh=00_AfC1nGAOadJm6HX3KG0msAqJqtaF4y5lMg_m1ldnko84rw&oe=6596C1FA"
              alt="educational institution"
              width={250}
              height={500}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div className="my-2 p-2">
              <Link href="/chool">
                <h2 className="text-sm text-gray-700 font-semibold">
                  Motherland Secondary School
                </h2>
              </Link>

              <div className="flex text-gray-500 font-medium gap-1">
                {" "}
                <CiLocationOn />
                <p className="text-xs ">Pokhara, Masbar-7</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col border shadow-lg">
            <Image
              src="https://scontent.fpkr1-1.fna.fbcdn.net/v/t39.30808-6/326699899_1421405765266861_1947129098856942635_n.jpg?stp=dst-jpg_s960x960&_nc_cat=109&ccb=1-7&_nc_sid=783fdb&_nc_ohc=dl5WFy4AItcAX_7r_eC&_nc_ht=scontent.fpkr1-1.fna&oh=00_AfC1nGAOadJm6HX3KG0msAqJqtaF4y5lMg_m1ldnko84rw&oe=6596C1FA"
              alt="educational institution"
              width={250}
              height={500}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div className="my-2 p-2">
              <Link href="/chool">
                <h2 className="text-sm text-gray-700 font-semibold">
                  Motherland Secondary School
                </h2>
              </Link>

              <div className="flex text-gray-500 font-medium gap-1">
                {" "}
                <CiLocationOn />
                <p className="text-xs ">Pokhara, Masbar-7</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col border shadow-lg">
            <Image
              src="https://scontent.fpkr1-1.fna.fbcdn.net/v/t39.30808-6/326699899_1421405765266861_1947129098856942635_n.jpg?stp=dst-jpg_s960x960&_nc_cat=109&ccb=1-7&_nc_sid=783fdb&_nc_ohc=dl5WFy4AItcAX_7r_eC&_nc_ht=scontent.fpkr1-1.fna&oh=00_AfC1nGAOadJm6HX3KG0msAqJqtaF4y5lMg_m1ldnko84rw&oe=6596C1FA"
              alt="educational institution"
              width={250}
              height={500}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div className="my-2 p-2">
              <Link href="/chool">
                <h2 className="text-sm text-gray-700 font-semibold">
                  Motherland Secondary School
                </h2>
              </Link>

              <div className="flex text-gray-500 font-medium gap-1">
                {" "}
                <CiLocationOn />
                <p className="text-xs ">Pokhara, Masbar-7</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col border shadow-lg">
            <Image
              src="https://scontent.fpkr1-1.fna.fbcdn.net/v/t39.30808-6/326699899_1421405765266861_1947129098856942635_n.jpg?stp=dst-jpg_s960x960&_nc_cat=109&ccb=1-7&_nc_sid=783fdb&_nc_ohc=dl5WFy4AItcAX_7r_eC&_nc_ht=scontent.fpkr1-1.fna&oh=00_AfC1nGAOadJm6HX3KG0msAqJqtaF4y5lMg_m1ldnko84rw&oe=6596C1FA"
              alt="educational institution"
              width={250}
              height={500}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div className="my-2 p-2">
              <Link href="/chool">
                <h2 className="text-sm text-gray-700 font-semibold">
                  Motherland Secondary School
                </h2>
              </Link>

              <div className="flex text-gray-500 font-medium gap-1">
                {" "}
                <CiLocationOn />
                <p className="text-xs ">Pokhara, Masbar-7</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col border shadow-lg">
            <Image
              src="https://scontent.fpkr1-1.fna.fbcdn.net/v/t39.30808-6/326699899_1421405765266861_1947129098856942635_n.jpg?stp=dst-jpg_s960x960&_nc_cat=109&ccb=1-7&_nc_sid=783fdb&_nc_ohc=dl5WFy4AItcAX_7r_eC&_nc_ht=scontent.fpkr1-1.fna&oh=00_AfC1nGAOadJm6HX3KG0msAqJqtaF4y5lMg_m1ldnko84rw&oe=6596C1FA"
              alt="educational institution"
              width={250}
              height={500}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div className="my-2 p-2">
              <Link href="/chool">
                <h2 className="text-sm text-gray-700 font-semibold">
                  Motherland Secondary School
                </h2>
              </Link>

              <div className="flex text-gray-500 font-medium gap-1">
                {" "}
                <CiLocationOn />
                <p className="text-xs ">Pokhara, Masbar-7</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col border shadow-lg">
            <Image
              src="https://scontent.fpkr1-1.fna.fbcdn.net/v/t39.30808-6/326699899_1421405765266861_1947129098856942635_n.jpg?stp=dst-jpg_s960x960&_nc_cat=109&ccb=1-7&_nc_sid=783fdb&_nc_ohc=dl5WFy4AItcAX_7r_eC&_nc_ht=scontent.fpkr1-1.fna&oh=00_AfC1nGAOadJm6HX3KG0msAqJqtaF4y5lMg_m1ldnko84rw&oe=6596C1FA"
              alt="educational institution"
              width={250}
              height={500}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div className="my-2 p-2">
              <Link href="/chool">
                <h2 className="text-sm text-gray-700 font-semibold">
                  Motherland Secondary School
                </h2>
              </Link>

              <div className="flex text-gray-500 font-medium gap-1">
                {" "}
                <CiLocationOn />
                <p className="text-xs ">Pokhara, Masbar-7</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col border shadow-lg">
            <Image
              src="https://scontent.fpkr1-1.fna.fbcdn.net/v/t39.30808-6/326699899_1421405765266861_1947129098856942635_n.jpg?stp=dst-jpg_s960x960&_nc_cat=109&ccb=1-7&_nc_sid=783fdb&_nc_ohc=dl5WFy4AItcAX_7r_eC&_nc_ht=scontent.fpkr1-1.fna&oh=00_AfC1nGAOadJm6HX3KG0msAqJqtaF4y5lMg_m1ldnko84rw&oe=6596C1FA"
              alt="educational institution"
              width={250}
              height={500}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div className="my-2 p-2">
              <Link href="/chool">
                <h2 className="text-sm text-gray-700 font-semibold">
                  Motherland Secondary School
                </h2>
              </Link>

              <div className="flex text-gray-500 font-medium gap-1">
                {" "}
                <CiLocationOn />
                <p className="text-xs ">Pokhara, Masbar-7</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Communities */}
      <div className="bg-white p-4 mt-5 rounded-lg">
        <div className="mb-5 flex justify-between">
          <div>
            <h2 className="text-primaryTextColor font-semibold text-xl">
              Communities
            </h2>
            <p className="text-ternaryTextColor font-bold  text-xs">
              Home / <span className="text-forteryTextColor ">Dashboard</span>
            </p>
          </div>
        </div>

        <GroupSlider />
      </div>

      {/* People */}
      <div className="bg-white p-4 mt-5 rounded-lg">
        <div className="mb-5 flex justify-between">
          <div>
            <h2 className="text-primaryTextColor font-semibold text-xl">
              Mentors
            </h2>
            <p className="text-ternaryTextColor font-bold  text-xs">
              Home / <span className="text-forteryTextColor ">Dashboard</span>
            </p>
          </div>
        </div>

        <PeopleSlider />
      </div>
    </div>
  );
};
export default Dashboard;
