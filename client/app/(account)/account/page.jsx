"use client";
import Image from "next/image";

import { useEffect, useState } from "react";
import { reducerCases } from "@/context/constants";
import { useSession } from "next-auth/react";
import { IoSettingsOutline } from "react-icons/io5";
import { IoKeyOutline } from "react-icons/io5";
import { LuClipboard } from "react-icons/lu";
import axios from "axios";
import { GET_USER_ROUTE, HOST, UPDATE_USER } from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";
import FormInput from "@/components/FormInut/Form";
import { accountInputs, securityInputs } from "./inputs";
import toast from "react-hot-toast";
import ProfileAvatar from "@/components/common/ProfileAvatar/ProfileAvatar";
import { backendAbsoluteUrl } from "@/lib/utils";
const Account = () => {
  const [{ userInfo }, dispatch] = useStateProvider();
  const [updatedDetails, setUpdatedDetails] = useState(false);
  const { data: session } = useSession();
  const [pic, setPic] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [values, setValues] = useState({
    email: "",
    bio: "",
    firstname: "",
    lastname: "",
    address: "",
  });

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
                name: data?.user?.name,
                identifier: data?.user?.identifier,
                status: data?.user?.about,
                profilePicture: data?.user?.profilePicture,
                username: data?.user?.username,
                email: data?.user?.email,
                bio: data?.user?.userProfile?.bio,
                firstname: data?.user?.firstname,
                lastname: data?.user?.lastname,
                address: data?.user?.userProfile?.address,
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
    setValues({
      ...values,
      email: userInfo?.email || "",
      bio: userInfo?.bio || "",
      firstname: userInfo?.firstname || "",
      lastname: userInfo?.lastname || "",
      address: userInfo?.address || "",
    });
  }, [userInfo]);

  const onChangeFormInputs = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
    if (
      //compare userpfi
      values.bio !== userInfo.bio ||
      values.address !== userInfo.address ||
      values.firstname !== userInfo.firstname ||
      values.lastname !== userInfo.lastname ||
      values.email !== userInfo.email
    ) {
      setUpdatedDetails(true);
    }
  };

  useEffect(() => {
    setPic(pic);
  }, [pic]);
  const handleTab = (type) => {
    setActiveTab(type);
  };
  const handleAccountUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append("avatar", pic);
      formData.append("email", values.email);
      formData.append("bio", values.bio);
      formData.append("firstname", values.firstname);
      formData.append("lastname", values.lastname);
      formData.append("address", values.address);
      const { data } = await axios.post(UPDATE_USER, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: { userId: userInfo?.id },
        //cant be sent and catch
        // data: { product: "sam" },
        // body: { product2: "sam2" },
      });

      if (data.status === 200) {
        dispatch({
          type: reducerCases.SET_USER_INFO,
          userInfo: {
            id: data.user.id,
            role: data.user.role,
            profilePicture: data.user.profilePicture,
            username: data.user.username,
            email: data.user.email,
            bio: data.user.userProfile.bio,
            firstname: data.user.firstname,
            lastname: data.user.lastname,
            address: data.user.userProfile.address,
            name: data.user.name,
            identifier: data.user.identifier,
            status: data.user.about,
          },
        });
        toast.success(data.msg);
        setUpdatedDetails(false);
      }
      if (data.status === 400 || data.status === 409 || data.status === 500) {
        toast.error(data.msg);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };
  return (
    <div className="p-2 sm:p-5 relative">
      <div className="bg-white rounded-lg">
        <div className="flex">
          {/* Sidebar */}
          <div className="h-full w-[60px] sm:w-[95px]">
            {/* Sidebar */}
            <ul className="h-full p-1 sm:p-3 rounded-l-lg rouned-b-lg border-gray-200 shadow-lg rouned-lg  ">
              <h2 className="text-lg hidden sm:block font-semibold text-gray-700">
                Settings
              </h2>
              <hr className="mb-3" />

              <li
                onClick={() => handleTab("general")}
                className={`${
                  activeTab === "general"
                    ? " bg-[#EEF2FA] text-primaryTextColor"
                    : " text-ternaryTextColor "
                } relative group  cursor-pointer `}
              >
                <span className="icon relative py-2 block px-3 text-center">
                  <IoSettingsOutline className=" group-hover:text-secondaryTextColor text-2xl" />
                </span>
                <span className="hidden sm:block group-hover:text-secondaryTextColor font-semibold relative py-2 px-2 whitespace-nowrap text-sm">
                  General
                </span>
              </li>

              <li
                onClick={() => handleTab("plans")}
                className={`${
                  activeTab === "plans"
                    ? " bg-[#EEF2FA] text-primaryTextColor"
                    : " text-ternaryTextColor "
                } relative group cursor-pointer  hover:bg-[#EEF2FA]`}
              >
                <span className="icon relative py-2 block px-3 text-center">
                  <LuClipboard className=" group-hover:text-secondaryTextColor text-2xl" />
                </span>
                <span className="hidden sm:block py-2 px-2 group-hover:text-secondaryTextColor font-semibold relative  whitespace-nowrap text-sm">
                  Plans
                </span>
              </li>

              <li
                onClick={() => handleTab("security")}
                className={`${
                  activeTab === "security"
                    ? " bg-[#EEF2FA] text-primaryTextColor"
                    : " text-ternaryTextColor "
                } relative group cursor-pointer hover:bg-[#EEF2FA]`}
              >
                <span className="icon relative py-2 block px-3 text-center">
                  <IoKeyOutline className=" group-hover:text-secondaryTextColor text-2xl" />
                </span>
                <span className="hidden sm:block py-2 px-2 group-hover:text-secondaryTextColor font-semibold relative  whitespace-nowrap text-sm">
                  Security
                </span>
              </li>
            </ul>
          </div>
          {/*Rightbar*/}
          <div className="flex flex-col p-1 sm:p-5 w-full">
            {activeTab === "general" && (
              <>
                <h2 className="text-lg sm:text-2xl font-semibold text-gray-700">
                  General Settings
                </h2>

                <hr />

                <div className="p-3 w-full flex flex-col items-center  ">
                  <div className="w-[200px] mt-3 sm:w-[400px] md:w-[500px] lg:w-[700px]">
                    {/* Avatar */}
                    <ProfileAvatar
                      pic={`${
                        userInfo?.profilePicture || "/avatars/userprofile.png"
                      }`}
                      setPic={setPic}
                    />

                    <form method="POST">
                      <div className="grid grid-cols-1   gap-3">
                        {accountInputs.slice(0, 2).map((input) => (
                          <FormInput
                            label={input.name}
                            readOnly={false}
                            key={input.id}
                            {...input}
                            value={values[input.name]}
                            onChange={(e) => onChangeFormInputs(e)}
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2  gap-3">
                        {accountInputs.slice(2, 5).map((input) => (
                          <FormInput
                            readOnly={false}
                            label={input.name}
                            key={input.id}
                            {...input}
                            value={values[input.name]}
                            onChange={(e) => onChangeFormInputs(e)}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => handleAccountUpdate()}
                        disabled={updatedDetails ? false : true}
                        className={`${
                          updatedDetails ? "bg-sky-500" : "bg-slate-400"
                        }  rounded-lg font-medium text-sm text-white py-3 px-2`}
                      >
                        Update
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}

            {activeTab === "plans" && (
              <>
                <h2 className="text-lg sm:text-2xl font-semibold text-gray-700">
                  Plans
                </h2>
                <hr />

                <div className="p-3 w-full flex flex-col items-center  ">
                  <div className="w-[200px] mt-3 sm:w-[400px] md:w-[500px] lg:w-[700px]"></div>
                </div>
              </>
            )}

            {activeTab === "security" && (
              <>
                <h2 className="text-lg sm:text-2xl font-semibold text-gray-700">
                  Security
                </h2>
                <hr />

                <div className="p-3 w-full flex flex-col items-center  ">
                  <div className="w-[200px] mt-3 sm:w-[400px] md:w-[500px] lg:w-[700px]">
                    <form onSubmit={handleAccountUpdate} method="POST">
                      <div className="grid grid-cols-1   gap-3">
                        {securityInputs.map((input) => (
                          <FormInput
                            label={input.name}
                            key={input.id}
                            {...input}
                            value={values[input.name]}
                            onChange={onChangeFormInputs}
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={IsFormFilled && isChecked ? false : true}
                        className={`${
                          IsFormFilled && isChecked
                            ? "bg-[#0e24a0]"
                            : "bg-[#b6b6b6]"
                        } font-medium text-sm text-white py-3 px-2`}
                      >
                        Update
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Account;
