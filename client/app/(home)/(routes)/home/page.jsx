"use client";
import Image from "next/image";
import Link from "next/link";

import { CiLocationOn } from "react-icons/ci";

import { useEffect, useState } from "react";
import { reducerCases } from "@/context/constants";
import Carousel from "./components/PCarousel/Carousel";
import { useSession } from "next-auth/react";

import axios from "axios";
import {
  GET_USER_ROUTE,
  GET_UNASSOCIATED_GROUPS,
  GET_UNFOLLOWED_MENTORS,
} from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";
import CommunityCarousel from "./components/PCarousel/CommunityCarousel";
import MentorCarousel from "./components/PCarousel/MentorCarousel";
const Dashboard = () => {
  const [{ userInfo }, dispatch] = useStateProvider();
  const [mentors, setMentors] = useState([]);
  const [communities, setCommunities] = useState([]);
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("All");
  const [filteredInstitutions, setFilteredInstitutions] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  //Get user from Db and set 'userInfo'
  useEffect(() => {
    const getUserInfo = async (e) => {
      try {
        if (session?.user) {
          if (!userInfo) {
            let { data } = await axios.post(GET_USER_ROUTE, {
              email: session?.user.email,
            });
            //Check if the user object with this email is logged in
            if (!data.status) {
              router.push("/login");
            }

            //Get the user from database and populate useInfo state
            dispatch({
              type: reducerCases.SET_USER_INFO,
              userInfo: {
                id: data?.user?.id,
                email: data?.user?.email,
                name: data?.user?.name,
                identifier: data?.user?.identifier,
                profileImage: data?.user?.profilePicture,
                status: data?.user?.about,
              },
            });
          }
        }
      } catch (e) {
        console.log(e);
      }
    };

    getUserInfo();
  }, [session]);

  useEffect(() => {
    if (userInfo) {
      const getEIs = async (e) => {
        try {
          let { data } = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_API}/api/ei/getAll`
          );
          setInstitutions(data.institutions);
          setFilteredInstitutions(data.institutions);
        } catch (e) {
          console.log(e);
        }
      };
      const getMentors = async (e) => {
        try {
          let { data } = await axios.get(
            `${GET_UNFOLLOWED_MENTORS}/${userInfo.id}`
          );
          setMentors(data.mentorsNotFollowed);
        } catch (e) {
          console.log(e);
        }
      };
      const getGroups = async (e) => {
        try {
          let { data } = await axios.get(
            `${GET_UNASSOCIATED_GROUPS}/${userInfo.id}`
          );
          console.log(data);
          setCommunities(data.unassociatedGroups);
        } catch (e) {
          console.log(e);
        }
      };
      getEIs();
      getGroups();
      getMentors();
    }
  }, [userInfo]);
  const handleTab = (type) => {
    setActiveTab(type);
    if (type === "All") {
      setFilteredInstitutions(institutions);
    } else {
      const filteredEis = institutions.filter((ei) => ei.type === type);
      setFilteredInstitutions(filteredEis);
    }
  };

  return (
    <div className="p-5">
      {/* Educational Consultancies */}
      <div className="bg-white p-4  rounded-lg">
        <div className="section-title">
          <h2 className="text-ternaryTextColor">Top</h2>
          <p className="text-primaryTextColor">Education Institutions</p>
        </div>

        {/* Cateogories */}
        <ul className="flex gap-3 p-2  mb-3 ">
          <li
            onClick={() => handleTab("All")}
            className={`${
              activeTab === "All"
                ? "bg-black text-white"
                : " bg-gray-200 text-gray-800 hover:bg-gray-300"
            } cursor-pointer text-sm  p-2 font-medium  rounded-lg`}
          >
            All
          </li>
          <li
            onClick={() => handleTab("School")}
            className={`${
              activeTab === "School"
                ? "bg-black text-white"
                : " bg-gray-200 text-gray-800 hover:bg-gray-300"
            }  cursor-pointer text-sm  p-2 font-medium  rounded-lg`}
          >
            School
          </li>
          <li
            onClick={() => handleTab("High School")}
            className={`${
              activeTab === "High School"
                ? "bg-black text-white"
                : " bg-gray-200 text-gray-800 hover:bg-gray-300"
            } cursor-pointer text-sm  p-2 font-medium  rounded-lg`}
          >
            High School
          </li>
          <li
            onClick={() => handleTab("College")}
            className={`${
              activeTab === "College"
                ? "bg-black text-white"
                : " bg-gray-200 text-gray-800 hover:bg-gray-300"
            } cursor-pointer text-sm  p-2 font-medium  rounded-lg`}
          >
            College
          </li>
          <li
            onClick={() => handleTab("Educational Consultancy")}
            className={`${
              activeTab === "Educational Consultancy"
                ? "bg-black text-white"
                : " bg-gray-200 text-gray-800 hover:bg-gray-300"
            } cursor-pointer text-sm  p-2 font-medium  rounded-lg`}
          >
            Educational Consultancy
          </li>
        </ul>
        <div className="bg-white grid grid-cols-3 gap-3">
          {filteredInstitutions.length > 0 ? (
            <>
              {filteredInstitutions.map((ei, index) => (
                <div key={index} className="flex flex-col border shadow-lg">
                  <div className="relative  overflow-hidden">
                    <Image
                      className="transform transition ease-in-out duration-300 hover:scale-110"
                      src={ei.thumbnail}
                      alt="educational institution"
                      width={250}
                      height={500}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <div className="my-2 p-2 leading-tight">
                    <Link href="/school">
                      <h2 className="text-[16px] text-gray-700 font-semibold">
                        {ei.name}
                      </h2>
                    </Link>
                    <hr />
                    <div className="">
                      <p className="text-sm  text-gray-600 ">
                        {ei.description.substring(0, 50)}...
                      </p>
                      <div className="flex text-gray-500 gap-1">
                        {" "}
                        <CiLocationOn />
                        <p className="text-xs ">{ei.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className=" col-span-3 border items-center justify-center shadow-lg p-4">
              No Educational Institutions found for this category.
            </div>
          )}
        </div>
      </div>

      {/* Communities */}
      <div className="bg-white p-4 mt-5 rounded-lg">
        <div className="mb-5 flex justify-between">
          <div className="section-title">
            <h2 className="text-ternaryTextColor">You might interested in</h2>
            <p className="text-primaryTextColor">Communities</p>
          </div>
        </div>
        <CommunityCarousel communities={communities} />
      </div>

      {/* Mentors */}
      <div className="bg-white p-4 mt-5 rounded-lg">
        <div className="mb-5 flex justify-between">
          <div className="section-title">
            <h2 className="text-ternaryTextColor">Follow</h2>
            <p className="text-primaryTextColor">Mentors</p>
          </div>
        </div>
        <MentorCarousel mentors={mentors} />
      </div>
    </div>
  );
};
export default Dashboard;
