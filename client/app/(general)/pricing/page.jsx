"use client";
import React, { useEffect, useState } from "react";
import { GET_USER_ROUTE, GET_USER_SUBSCRIPTION_PLAN } from "@/utils/ApiRoutes";
import { reducerCases } from "@/context/constants";
import { SubscriptionPlans } from "./SubscriptionPlans";

import { useStateProvider } from "@/context/StateContext";
import { useSession } from "next-auth/react";

import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function PricingPage() {
  const router = useRouter();
  const [userSubscriptionPlan, setUserSubscriptionPlan] = useState({});

  const [{ userInfo }, dispatch] = useStateProvider();
  const { data: session } = useSession();
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
              role: data?.user?.role,
              email: data?.user?.email,
              name: data?.user?.name,
              username: data?.user?.username,
              eiOwner: data?.user?.eiOwner,
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
 
  useEffect(() => {
    if (session?.user) {
      getUserInfo();
    }
  }, [session?.user]);

  useEffect(() => {
    if (userInfo) {
      getUserSubscriptionPlan();
    }
  }, [userInfo]);
  const getUserSubscriptionPlan = async () => {
    const { data } = await axios.post(GET_USER_SUBSCRIPTION_PLAN, {
      userId: userInfo?.id,
    });
    setUserSubscriptionPlan(data);
  };

  const handleBtnClick = (planId) => {
    if (!session?.user) {
      router.push("/login?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fpricing");
    } else {
      getUserInfo();

      if (!userInfo?.eiOwner) {
        router.push(`/createEducationalInstitution/${planId}`);
      } else {
        router.push("/account");
      }
    }
  };
  return (
    <>
      <div className="relative bg-[#0D0225]  z-10 min-w-full  md:min-h-header md:h-header  border-b border-transparent">
        {/* Header */}
        <header className="grid grid-flow-col lg:auto-cols-fr items-center py-2 md:py-0 md:h-header md:min-h-header mx-auto max-w-container">
          <div className="flex space-x-1 items-center md:w-auto md:min-w-0 flex-none">
            <a
              title="Dashboard"
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-700 flex items-center mr-4"
              href="/dashboard"
            >
              <svg
                className="rounded-full logo w-6 h-6 md:w-8 md:h-8"
                aria-label="Railway Logo"
                width="1024"
                height="1024"
                viewBox="0 0 1024 1024"
                fill="none"
              >
                <path
                  d="M4.756 438.175A520.713 520.713 0 0 0 0 489.735h777.799c-2.716-5.306-6.365-10.09-10.045-14.772-132.97-171.791-204.498-156.896-306.819-161.26-34.114-1.403-57.249-1.967-193.037-1.967-72.677 0-151.688.185-228.628.39-9.96 26.884-19.566 52.942-24.243 74.14h398.571v51.909H4.756ZM783.93 541.696H.399c.82 13.851 2.112 27.517 3.978 40.999h723.39c32.248 0 50.299-18.297 56.162-40.999ZM45.017 724.306S164.941 1018.77 511.46 1024c207.112 0 385.071-123.006 465.907-299.694H45.017Z"
                  fill="#000"
                ></path>
                <path
                  d="M511.454 0C319.953 0 153.311 105.16 65.31 260.612c68.771-.144 202.704-.226 202.704-.226h.031v-.051c158.309 0 164.193.707 195.118 1.998l19.149.706c66.7 2.224 148.683 9.384 213.19 58.19 35.015 26.471 85.571 84.896 115.708 126.52 27.861 38.499 35.876 82.756 16.933 125.158-17.436 38.97-54.952 62.215-100.383 62.215H16.69s4.233 17.944 10.58 37.751h970.632A510.385 510.385 0 0 0 1024 512.218C1024.01 229.355 794.532 0 511.454 0Z"
                  fill="#000"
                ></path>
              </svg>
              <span className="ml-4 text-xl font-bold hidden">Railway</span>
            </a>
          </div>
          <button
            className="group/button flex items-center justify-center border transform transition-transform duration-50 active:scale-95 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 bg-transparent border-transparent text-foreground hover:bg-gray-100 hover:border-gray-100 disabled:bg-transparent disabled:border-transparent focus-visible:ring-gray-600 focus-visible:bg-gray-100 h-[34px] py-1.5 rounded-md text-sm leading-5 space-x-2 w-[34px] px-0 ml-auto"
            title="Open mobile navigation"
          >
            <div
              className="text-current icon-container icon-md  w-6 !h-6"
              aria-hidden="true"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4.5 9h15m-15 6h15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                ></path>
              </svg>
            </div>
          </button>
        </header>

        {/* Pricing */}
        <div className="flex flex-col ">
          <header className="text-center mb-16">
            <h1 className="text-jumbo font-bold text-white text-5xl mt-8 md:mt-20 mb-2">
              Pricing
            </h1>
            <h2 className="text-base text-gray-500">
              Plans that empower you and your team to work without friction.
            </h2>
          </header>
          <div className="mb-16 flex flex-col items-center p-2 mx-auto">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-center lg:justify-evenly lg:items-end xl:w-[1190px]">
              {/* hobby */}
              <div className="flex flex-col space-y-8 p-8 rounded-xl border border-opacity-40 w-full drop-shadow-[0_17px_17px_rgba(40,97,230,0.07)] border-blue-200 bg-gradient-to-b-blue from-blue-50 to-background">
                <div>
                  <div className="text-[24px] font-bold leading-10 text-blue-700">
                    {SubscriptionPlans[0].plan}
                  </div>
                  <p className="leading-7 font-normal text-blue-400 dark:text-blue-800">
                    {SubscriptionPlans[0].description}
                  </p>
                </div>
                <div className="flex-col gap-[2px] flex text-blue-600">
                  <div className="h-12 gap-[12px] justify-start items-center inline-flex pb-2">
                    <span className="text-[24px] leading-10">$</span>
                    <span className="text-[56px] font-semibold leading-10">
                      {SubscriptionPlans[0].price}
                    </span>
                    <span className="text-[32px] font-normal leading-10">
                      /mo
                    </span>
                  </div>
                  <div className="items-center gap-[12px] inline-flex text-[14px] font-semibold uppercase leading-normal">
                    <svg
                      className="w-4"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14m-7-7h14"></path>
                    </svg>
                    Resource usage
                  </div>
                </div>
                <div className="justify-center items-center inline-flex my-4">
                  <div className="w-full h-[1px] bg-gray-100 bg-opacity-5"></div>
                </div>
                <div className="flex flex-col space-y-4">
                  <div className="justify-start items-center gap-3 inline-flex">
                    <svg
                      className="w-5 h-5 justify-center items-center flex text-blue-700"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 12v10H4V12M2 7h20v5H2zm10 15V7m0 0H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                    </svg>
                    <div className="grow shrink basis-0 p-0 flex-col justify-start items-start inline-flex text-blue-600">
                      <div className="self-stretch text-4 leading-normal">
                        <span className="font-semibold">
                          Includes $5 of usage monthly
                        </span>
                      </div>
                    </div>
                  </div>
                  {SubscriptionPlans[0].features.map((item, i) => (
                    <div
                      key={i}
                      className="justify-start items-center gap-3 inline-flex"
                    >
                      <div className="w-5 h-5 p-1 rounded-xl border justify-center items-center flex bg-blue-50 border-blue-200">
                        <svg
                          className="text-blue-700"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                      </div>
                      <div className="grow shrink basis-0 p-0 flex-col justify-start items-start inline-flex text-blue-600">
                        <div className="self-stretch text-4 leading-normal">
                          {item}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {session?.user ? (
                  <>
                    {userInfo?.eiOwner &&
                    userSubscriptionPlan?.plan === SubscriptionPlans[0].plan ? (
                      <Link
                        href="/account"
                        className="group/button flex items-center justify-center transform transition-transform duration-50 active:scale-95 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 border-pink-500 hover:border-pink-600 disabled:bg-pink-500 disabled:border-pink-500 focus-visible:ring-pink-600 h-[42px] py-2 px-3 rounded-md text-base leading-6 space-x-3 bg-blue-500 hover:bg-blue-700 text-white font-semibold border-0 w-full"
                      >
                        Go to My Plans
                      </Link>
                    ) : (
                      <button
                        className="group/button flex items-center justify-center transform transition-transform duration-50 active:scale-95 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 border-pink-500 hover:border-pink-600 disabled:bg-pink-500 disabled:border-pink-500 focus-visible:ring-pink-600 h-[42px] py-2 px-3 rounded-md text-base leading-6 space-x-3 bg-blue-500 hover:bg-blue-700 text-white font-semibold border-0 w-full"
                        onClick={() => handleBtnClick(SubscriptionPlans[0].id)}
                      >
                        Subscribe
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    className="group/button flex items-center justify-center transform transition-transform duration-50 active:scale-95 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 border-pink-500 hover:border-pink-600 disabled:bg-pink-500 disabled:border-pink-500 focus-visible:ring-pink-600 h-[42px] py-2 px-3 rounded-md text-base leading-6 space-x-3 bg-blue-500 hover:bg-blue-700 text-white font-semibold border-0 w-full"
                    onClick={() => handleBtnClick(SubscriptionPlans[0].id)}
                  >
                    Sign Up to Continue
                  </button>
                )}
              </div>

              {/* pto */}
              <div className="flex flex-col space-y-8 p-8 rounded-xl border border-opacity-40 w-full drop-shadow-[0_17px_17px_rgba(113,65,225,0.17)] border-pink-200 bg-gradient-to-b-pink from-pink-50 to-background">
                <div>
                  <div className="text-[24px] font-bold leading-10 text-pink-700">
                    {SubscriptionPlans[1].plan}
                  </div>
                  <p className="leading-7 font-normal text-pink-400 dark:text-pink-800">
                    {SubscriptionPlans[1].description}
                  </p>
                </div>
                <div className="flex-col gap-[2px] flex text-pink-600">
                  <div className="h-12 gap-[12px] justify-start items-center inline-flex pb-2">
                    <span className="text-[24px] leading-10">$</span>
                    <span className="text-[56px] font-semibold leading-10">
                      {SubscriptionPlans[1].price}
                    </span>
                    <span className="text-[32px] font-normal leading-10">
                      /mo
                    </span>
                  </div>
                  <div className="items-center gap-[12px] inline-flex text-[14px] font-semibold uppercase leading-normal">
                    <svg
                      className="w-4"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14m-7-7h14"></path>
                    </svg>
                    Resource usage
                  </div>
                </div>
                <div className="justify-center items-center inline-flex my-4">
                  <div className="w-full h-[1px] bg-gray-100 bg-opacity-5"></div>
                </div>
                <div className="flex flex-col space-y-4">
                  <div className="justify-start items-center gap-3 inline-flex">
                    <div className="w-5 h-5 p-1 rounded-xl border justify-center items-center flex bg-pink-50 border-pink-200">
                      <svg
                        className="text-pink-900"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    </div>
                    <div className="grow shrink basis-0 p-0 flex-col justify-start items-start inline-flex text-pink-600">
                      <div className="self-stretch text-4 leading-normal">
                        <span className="font-semibold">
                          All Standard plan features and:
                        </span>
                      </div>
                    </div>
                  </div>
                  {SubscriptionPlans[1].features.map((item, i) => (
                    <div
                      key={i}
                      className="justify-start items-center gap-3 inline-flex"
                    >
                      <div className="w-5 h-5 p-1 rounded-xl border justify-center items-center flex bg-pink-50 border-pink-200">
                        <svg
                          className="text-pink-900"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                      </div>
                      <div className="grow shrink basis-0 p-0 flex-col justify-start items-start inline-flex text-pink-600">
                        <div className="self-stretch text-4 leading-normal">
                          {item}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {session?.user ? (
                  <>
                    {userInfo?.eiOwner &&
                    userSubscriptionPlan?.plan === SubscriptionPlans[1].plan ? (
                      <Link
                        href="/account"
                        className="group/button flex items-center justify-center transform transition-transform duration-50 active:scale-95 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 border-pink-500 hover:border-pink-600 disabled:bg-pink-500 disabled:border-pink-500 focus-visible:ring-pink-600 h-[42px] py-2 px-3 rounded-md text-base leading-6 space-x-3 bg-blue-500 hover:bg-blue-700 text-white font-semibold border-0 w-full"
                      >
                        Go to My Plans
                      </Link>
                    ) : (
                      <button
                        className="group/button flex items-center justify-center transform transition-transform duration-50 active:scale-95 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 border-pink-500 hover:border-pink-600 disabled:bg-pink-500 disabled:border-pink-500 focus-visible:ring-pink-600 h-[42px] py-2 px-3 rounded-md text-base leading-6 space-x-3 bg-blue-500 hover:bg-blue-700 text-white font-semibold border-0 w-full"
                        onClick={() => handleBtnClick(SubscriptionPlans[1].id)}
                      >
                        Subscribe
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    className="group/button flex items-center justify-center transform transition-transform duration-50 active:scale-95 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 border-pink-500 hover:border-pink-600 disabled:bg-pink-500 disabled:border-pink-500 focus-visible:ring-pink-600 h-[42px] py-2 px-3 rounded-md text-base leading-6 space-x-3 bg-blue-500 hover:bg-blue-700 text-white font-semibold border-0 w-full"
                    onClick={() => handleBtnClick(SubscriptionPlans[1].id)}
                  >
                    Sign Up to Continue
                  </button>
                )}
              </div>
              {/* Enterprise */}
              <div className="flex flex-col space-y-8 p-8 rounded-xl border border-opacity-40 w-full drop-shadow-[0_17px_17px_rgba(0,0,0,0.07)] border-green-200 bg-gradient-to-b-green from-green-50 to-background">
                <div>
                  <div className="text-[24px] font-bold leading-10 text-green-700">
                    {SubscriptionPlans[2].plan}
                  </div>
                  <p className="leading-7 font-normal text-green-400 dark:text-green-800">
                    Unrivaled levels of support and scale for your company.
                  </p>
                </div>
                <div className="h-12 gap-[12px] text-green-600 justify-start items-center inline-flex pb-2">
                  <div className="flex flex-col">
                    <div className="flex pb-3 gap-2">
                      <span className="text-[24px] leading-10">$</span>
                      <span className="text-[56px] font-semibold leading-10">
                        {SubscriptionPlans[2].price}
                      </span>
                      <span className="text-[32px] font-normal leading-10">
                        /mo
                      </span>
                    </div>
                    <div className="items-center gap-[12px] inline-flex text-[14px] font-semibold uppercase leading-normal">
                      ALL-IN-ONE PACKAGE
                    </div>
                  </div>
                </div>

                <div className="justify-center items-center inline-flex my-4">
                  <div className="w-full h-[1px] bg-gray-100 bg-opacity-5"></div>
                </div>
                <div className="flex flex-col space-y-4">
                  {SubscriptionPlans[2].features.map((item, i) => (
                    <div
                      key={i}
                      className="justify-start items-center gap-3 inline-flex"
                    >
                      <div className="w-5 h-5 p-1 rounded-xl border justify-center items-center flex bg-green-50 border-green-200">
                        <svg
                          className="text-green-900"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                      </div>
                      <div className="grow shrink basis-0 p-0 flex-col justify-start items-start inline-flex text-green-600">
                        <div className="self-stretch text-4 leading-normal">
                          {item}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {session?.user ? (
                  <>
                    {userInfo?.eiOwner &&
                    userSubscriptionPlan?.plan === SubscriptionPlans[2].plan ? (
                      <Link
                        href="/account"
                        className="group/button flex items-center justify-center transform transition-transform duration-50 active:scale-95 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 border-pink-500 hover:border-pink-600 disabled:bg-pink-500 disabled:border-pink-500 focus-visible:ring-pink-600 h-[42px] py-2 px-3 rounded-md text-base leading-6 space-x-3 bg-blue-500 hover:bg-blue-700 text-white font-semibold border-0 w-full"
                      >
                        Go to My Plans
                      </Link>
                    ) : (
                      <button
                        className="group/button flex items-center justify-center transform transition-transform duration-50 active:scale-95 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 border-pink-500 hover:border-pink-600 disabled:bg-pink-500 disabled:border-pink-500 focus-visible:ring-pink-600 h-[42px] py-2 px-3 rounded-md text-base leading-6 space-x-3 bg-blue-500 hover:bg-blue-700 text-white font-semibold border-0 w-full"
                        onClick={() => handleBtnClick(SubscriptionPlans[2].id)}
                      >
                        Subscribe
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    className="group/button flex items-center justify-center transform transition-transform duration-50 active:scale-95 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 border-pink-500 hover:border-pink-600 disabled:bg-pink-500 disabled:border-pink-500 focus-visible:ring-pink-600 h-[42px] py-2 px-3 rounded-md text-base leading-6 space-x-3 bg-blue-500 hover:bg-blue-700 text-white font-semibold border-0 w-full"
                    onClick={() => handleBtnClick(SubscriptionPlans[2].id)}
                  >
                    Sign Up to Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
