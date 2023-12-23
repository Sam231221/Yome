"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

import { useStateProvider } from "@/context/StateContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoginContainer from "./components/LoginContainer";
import RegisterContainer from "./components/RegisterContainer";
import toast from "react-hot-toast";
export default function Login() {
  const router = useRouter();
  const [{ userInfo, newUser }, dispatch] = useStateProvider();
  const [activeTab, setActiveTab] = useState("login");
  const session = useSession();

  useEffect(() => {
    if (session?.status === "authenticated") {
      toast.success("You are already logged in");
      router.push("/home");
    }
  }, [session?.status, router]);

  return (
    <div className="grid grid-cols-6">
      <div className="hidden xl:block xl:col-span-4">
        <div
          className=" w-full h-screen bg-cover bg-no-repeat"
          style={{ backgroundImage: "url('/loginBanner.PNG')" }}
        ></div>
      </div>

      <div className="h-screen w-full col-span-6 xl:col-span-2 flex justify-center items-center p-10">
        <div className=" md:w-[400px] lg:w-[600px] xl:w-full flex flex-col p-3">
          <div className="xl:hidden flex mb-5 w-full justify-center">
            <Image src={"/LogoB.png"} width={35} height={50} alt="logo" />
            <h1 className="ml-2 text-4xl font-bold">Eduroclass</h1>
          </div>

          {/*Tabs */}
          <div className="max-h-screen overflow-y-auto">
            <div className="flex w-full">
              <div
                className={`${
                  activeTab === "login"
                    ? "font-bold border-b-[#006cfa]"
                    : "border-b-[#d6d6d6]"
                } border-b-[2px] w-[50%] uppercase cursor-pointer  text-center px-3 py-2`}
                onClick={() => setActiveTab("login")}
              >
                <span>Login</span>
              </div>

              <div
                className={`${
                  activeTab === "register"
                    ? "font-bold border-b-[#006cfa]"
                    : "border-b-[#d6d6d6]"
                } border-b-[2px] w-[50%] uppercase cursor-pointer text-center px-3 py-2`}
                onClick={() => setActiveTab("register")}
              >
                <span>Register</span>
              </div>
            </div>

            {/*LoginContainer*/}
            <LoginContainer activeTab={activeTab} />
            <RegisterContainer
              setActiveTab={setActiveTab}
              activeTab={activeTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
