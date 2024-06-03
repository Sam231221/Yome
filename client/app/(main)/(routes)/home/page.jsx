"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import toast from "react-hot-toast";

import {
  GET_USER_ROUTE,
  GET_UNASSOCIATED_GROUPS,
  GET_UNFOLLOWED_MENTORS,
} from "@/utils/ApiRoutes";
import InstitutionsListings from "./components/InsitutionsListings";
import CommunityCarousel from "./components/PCarousel/CommunityCarousel";
import MentorCarousel from "./components/PCarousel/MentorCarousel";
const Home = () => {
  const [{ userInfo }, dispatch] = useStateProvider();
  const [mentors, setMentors] = useState([]);
  const [isMentorsLoading, setMentorsLoading] = useState(true);
  const [hasMentorsErrors, setMentorsErrors] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [hasCommunitiesErrors, setCommunitiesErrors] = useState(false);
  const [isCommunitiesLoading, setCommunitiesLoading] = useState(true);
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("All");

  //Get user from Db and set 'userInfo'
  useEffect(() => {
    const getUserInfo = async (e) => {
      try {
        if (session?.user) {
          if (!userInfo) {
            let { data } = await axios.post(GET_USER_ROUTE, {
              email: session?.user.email,
            });
            //Get the user from database and populate useInfo state
            dispatch({
              type: reducerCases.SET_USER_INFO,
              userInfo: {
                id: data?.user?.id,
                role: data?.user?.role,
                email: data?.user?.email,
                name: data?.user?.name,
                username: data?.user?.username,
                firstname: data?.user?.firstname,
                lastname: data?.user?.lastname,
                userProfile: data?.user?.userProfile,
                identifier: data?.user?.identifier,
                profilePicture: data?.user?.profilePicture,
                status: data?.user?.about,
              },
            });
          }
        }
      } catch (e) {
        toast.error(e);
      }
    };

    getUserInfo();
  }, [session]);

  useEffect(() => {
    if (userInfo) {
      getGroups();
      getMentors();
    }
  }, [userInfo]);

  const getMentors = async (e) => {
    try {
      let { data } = await axios.get(
        `${GET_UNFOLLOWED_MENTORS}/${userInfo.id}`
      );
      setMentors(data.mentorsNotFollowed);
      setMentorsLoading(false);
    } catch (e) {
      setMentorsErrors(e);
      setMentorsLoading(false);
    }
  };
  const getGroups = async (e) => {
    try {
      let { data } = await axios.get(
        `${GET_UNASSOCIATED_GROUPS}/${userInfo.id}`
      );
      setCommunities(data.unassociatedGroups);
      setCommunitiesLoading(false);
    } catch (e) {
      setCommunitiesErrors(false);
      setCommunitiesLoading(false);
    }
  };
  const handleTab = (type) => {
    setActiveTab(type);
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
        <ul className="flex flex-wrap gap-3 p-2  mb-3 ">
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
        <InstitutionsListings activeTab={activeTab} />
      </div>

      {/* Communities */}
      <div className="bg-white p-4 mt-5 rounded-lg">
        <div className="mb-5 flex justify-between">
          <div className="section-title">
            <h2 className="text-ternaryTextColor">You might interested in</h2>
            <p className="text-primaryTextColor">Communities</p>
          </div>
        </div>
        <CommunityCarousel
          isLoading={isCommunitiesLoading}
          hasErrors={hasCommunitiesErrors}
          communities={communities}
        />
      </div>

      {/* Mentors */}
      <div className="bg-white p-4 mt-5 rounded-lg">
        <div className="mb-5 flex justify-between">
          <div className="section-title">
            <h2 className="text-ternaryTextColor">Follow</h2>
            <p className="text-primaryTextColor">Mentors</p>
          </div>
        </div>
        <MentorCarousel
          isLoading={isMentorsLoading}
          hasErrors={hasMentorsErrors}
          mentors={mentors}
        />
      </div>
    </div>
  );
};
export default Home;
