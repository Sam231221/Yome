"use client";
import Image from "next/image";
import React, { Suspense, useEffect, useState } from "react";

import { MessageCircle, Users, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoginContainer from "./components/LoginContainer";
import RegisterContainer from "./components/RegisterContainer";

export default function Login() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const session = useSession();

  useEffect(() => {
    if (session?.status === "authenticated") {
      router.push("/dashboard");
    }
  }, [session?.status, router]);

  return (
    <div className="grid grid-cols-6">
      <div className="hidden xl:flex xl:col-span-4 min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0b1b3a] via-[#0f2d63] to-[#1e40af]">
        <div className="absolute top-[-80px] right-[-80px] w-64 h-64 bg-[#2c4fd9]/20 blur-3xl rounded-full" />
        <div className="absolute bottom-[-120px] left-[-120px] w-80 h-80 bg-[#2c4fd9]/20 blur-3xl rounded-full" />

        <div className="relative z-10 flex flex-col h-full p-14 text-white">
          <div className="flex items-center gap-2">
            <Image src={"/logos/LogoWhiteT.png"} width={40} height={40} alt="logo" />
            <h1 className="text-3xl font-bold">Yome</h1>
          </div>

          <div className="mt-16">
            <h2 className="text-5xl font-bold leading-tight">
              Connect. Chat. Call.
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl">
              A social space for real-time conversations, video hangouts, and
              shared communities.
            </p>
          </div>

          <div className="mt-10 grid gap-4 max-w-xl">
            <div className="flex gap-4 items-start bg-white/10 border border-white/15 rounded-xl p-4 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold">Instant Messaging</p>
                <p className="text-white/75">
                  Fast, reliable chats with rich media.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-white/10 border border-white/15 rounded-xl p-4 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold">Audio & Video Calls</p>
                <p className="text-white/75">
                  HD calls with low-latency connections.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start bg-white/10 border border-white/15 rounded-xl p-4 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold">Communities & Groups</p>
                <p className="text-white/75">
                  Stay close to the people that matter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-screen w-full col-span-6 xl:col-span-2 flex justify-center items-center p-10">
        <div className=" md:w-[400px] lg:w-[600px] xl:w-full flex flex-col p-3">
          <div className="xl:hidden flex mb-5 w-full justify-center">
            <Image src={"/LogoB.png"} width={40} height={40} alt="logo" />
            <h1 className="ml-2 text-4xl font-bold">Yome</h1>
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

            <Suspense fallback={<div className="p-4">Loading...</div>}>
              <LoginContainer activeTab={activeTab} />
              <RegisterContainer
                setActiveTab={setActiveTab}
                activeTab={activeTab}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
