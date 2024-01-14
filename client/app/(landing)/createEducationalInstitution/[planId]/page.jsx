"use client";
import { IoSearchOutline } from "react-icons/io5";

import { MessagesDropDown } from "@/components/MessagesDropDown";
import { NotificationDropdown } from "@/components/NotificationDropDown";
import { ProfileDropDown } from "@/components/ProfileDropDown";
import { useParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { reducerCases } from "@/context/constants";
import {
  CREATE_EDUCATIONAL_INSTITUTION,
  GET_USER_ROUTE,
  GET_USER_SUBSCRIPTION_PLAN,
} from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { SubscriptionPlans } from "../../pricing/SubscriptionPlans";
import FormInput from "@/components/FormInut/Form";
import { institutionsInputs } from "./inputs";
import { ManageUserSubscriptionButton } from "../../pricing/UserSubsrciptionButton";
import DropZoneUploader from "@/components/common/DropZoneUploader";

export default function Page() {
  const [userSubscriptionPlan, setUserSubscriptionPlan] = useState({});
  const [IsFormFilled, setFormFill] = useState(false);
  const { data: session } = useSession();
  const [{ userInfo }, dispatch] = useStateProvider();
  const pathname = usePathname();
  const planId = pathname.split("/")[2];
  const [thumbnail, setThumbnail] = useState("");
  const subscriptionplan = SubscriptionPlans.find(
    (institution) => institution.id === planId
  );

  const [category, setSelectedCategory] = useState("");
  const [type, setSelectedType] = useState("");
  const [values, setValues] = useState({
    name: "",
    description: "",
    principal_name: "",
    principal_email: "",
    address: "",
    contact: "",
    accreditation_status: "",
  });
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
        console.log(e);
      }
    };

    getUserInfo();
  }, [session]);

  useEffect(() => {
    if (userInfo) {
      getUserSubscriptionPlan();
    }
  }, [userInfo]);
  const getUserSubscriptionPlan = async () => {
    const { data } = await axios.post(GET_USER_SUBSCRIPTION_PLAN, {
      userId: userInfo.id,
    });

    setUserSubscriptionPlan(data);
  };

  useEffect(() => {
    if (
      values.name !== "" &&
      values.description !== "" &&
      values.principal_name !== "" &&
      values.contact !== "" &&
      values.address !== "" &&
      type !== "" &&
      category !== "" &&
      values.accreditation_status !== "" &&
      values.principal_email !== ""
    ) {
      setFormFill(true);
    } else {
      setFormFill(false);
    }
  }, [values, type, category]);

  const handleOnSelectCategory = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleOnSelectType = (e) => {
    setSelectedType(e.target.value);
  };

  const onChangeFormInputs = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleCreateInstitution = async () => {
    try {
      const formData = new FormData();
      formData.append("thumbnail", thumbnail);
      formData.append("type", type);
      formData.append("category", category);
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("address", values.address);
      formData.append("accreditation_status", values.accreditation_status);
      formData.append("principal_name", values.principal_name);
      formData.append("principal_email", values.principal_email);
      formData.append("contact", values.contact);

      const { data } = await axios.post(
        CREATE_EDUCATIONAL_INSTITUTION,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          params: { userId: userInfo?.id },
        }
      );

      if (data.status === 200) {
        return {
          status: 200,
          msg: data.msg,
        };
      }
      if (data.status === 400 || data.status === 409 || data.status === 500) {
        return {
          status: data.status,
          msg: data.msg,
        };
      }
    } catch (error) {
      return {
        status: 500,
        msg: data.msg,
      };
    }
  };
  return (
    <div className="relative w-full">
      {/* Topbar */}
      <div className="topbar z-[3] shadow-lg sticky top-0 bg-white w-full h-[60px] flex justify-between items-center">
        <div className="flex gap-2 ml-3 items-center">
          <div className="w-10 h-10">
            <Image
              width={40}
              height={40}
              loading="lazy"
              className="w-full h-full"
              src="/logos/LogoBlueT.png"
            />
          </div>
          <h1 className="text-gray-700 text-lg font-bold">Eduroclass</h1>
        </div>

        <div className="flex gap-4 pr-4">
          {/* SearchBar */}
          <div className="border-[1px] ml-5 min-w-[300px] border-ternaryTextColor flex focus:border-secondaryTextColor items-center">
            <input
              className="border-none w-full py-2 px-4 outline-none text-primaryTextColor text-sm"
              type="text"
              placeholder="Search for ..."
            />
            <IoSearchOutline className="w-[40px] h-[40px] py-2 px-2 cursor-pointer text-primaryTextColor" />
          </div>

          <NotificationDropdown />
          <MessagesDropDown />
          <ProfileDropDown />
        </div>
      </div>

      <div className="p-5 w-full h-full flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-5 w-[400px] sm:w-[700px] lg:w-[800px]">
          <h1 className="text-gray-700 text-3xl font-semibold">
            Create Educational Institution
          </h1>
          <hr />

          <form className="mt-5">
            <div className="grid grid-cols-1   gap-3">
              {institutionsInputs.slice(0, 2).map((input) => (
                <FormInput
                  label={input.label}
                  readOnly={false}
                  key={input.id}
                  {...input}
                  value={values[input.name]}
                  onChange={(e) => onChangeFormInputs(e)}
                />
              ))}
            </div>
            {/* DropZone Uploader */}
            <div className="my-3">
              <label className="text-gray-600 font-medium">Thumbnail</label>
              <DropZoneUploader
                setThumbnail={setThumbnail}
                classes={"w-full my-2"}
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center ">
              {/* TYpe */}
              <div className="my-3 flex gap-2 items-center">
                <label className="text-gray-600 font-medium" htmlFor="type">
                  Type:
                </label>
                <select
                  onChange={handleOnSelectType}
                  value={type}
                  className="text-sm py-2 focus:outline-none border-[1px] focus:border-secondaryTextColor"
                  name=""
                  id="type"
                >
                  <option className="text-gray-600 font-medium py-2" value="">
                    --------
                  </option>
                  <option
                    className="text-gray-600 font-medium py-2"
                    value="Private"
                  >
                    Private
                  </option>
                  <option
                    className="text-gray-600 font-medium py-2"
                    value=" Public"
                  >
                    Public
                  </option>
                </select>
              </div>
              {/* Category */}
              <div className="my-3  flex gap-2 items-center">
                <label className="text-gray-600 font-medium" htmlFor="Category">
                  Category:
                </label>
                <select
                  onChange={handleOnSelectCategory}
                  value={category}
                  className="text-sm py-2 focus:outline-none border-[1px] focus:border-secondaryTextColor"
                  name=""
                  id="category"
                >
                  <option className="text-gray-600 font-medium py-2" value="">
                    -----------------------
                  </option>
                  <option
                    value="School"
                    className="text-gray-600 font-medium py-2"
                  >
                    School
                  </option>
                  <option
                    value="High School"
                    className="text-gray-600 font-medium py-2"
                  >
                    High School
                  </option>
                  <option
                    value="College"
                    className="text-gray-600 font-medium py-2"
                  >
                    College
                  </option>
                  <option
                    value="Educational Consultancy"
                    className="text-gray-600 font-medium py-2"
                  >
                    Educational Consultancy
                  </option>
                </select>
              </div>

              <div className="mb-3  flex gap-2 items-center">
                <label className="text-gray-600 font-medium" htmlFor="Category">
                  Accreditation Status:
                </label>
                <FormInput
                  readOnly={false}
                  key={institutionsInputs[6].id}
                  {...institutionsInputs[6]}
                  value={values[institutionsInputs[6].name]}
                  onChange={(e) => onChangeFormInputs(e)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2  gap-3">
              {institutionsInputs.slice(2, 6).map((input) => (
                <FormInput
                  readOnly={false}
                  label={input.label}
                  key={input.id}
                  {...input}
                  value={values[input.name]}
                  onChange={(e) => onChangeFormInputs(e)}
                />
              ))}
            </div>
            <ManageUserSubscriptionButton
              formValues={values}
              classes={`group/button flex items-center justify-center transform transition-transform duration-50 active:scale-95 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 border-pink-500 hover:border-pink-600 disabled:bg-pink-500 disabled:border-pink-500 focus-visible:ring-pink-600 h-[42px] py-2 px-3 rounded-md text-base leading-6 space-x-3 bg-blue-500 hover:bg-blue-700 text-white font-semibold border-0 w-full`}
              userId={userInfo?.id}
              email={userInfo?.email}
              IsFormFilled={IsFormFilled}
              handleCreateInstitution={handleCreateInstitution}
              stripePriceId={subscriptionplan.stripePriceId}
              stripeCustomerId={userSubscriptionPlan?.stripeCustomerId}
              isSubscribed={!!userSubscriptionPlan?.isSubscribed}
              isCurrentPlan={
                userSubscriptionPlan?.plan === subscriptionplan.plan
              }
            />
          </form>
        </div>
      </div>
    </div>
  );
}
