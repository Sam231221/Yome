"use client";
import React, { Suspense, useEffect, useState } from "react";

import { BookOpen, FlaskConical, HelpCircle, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoginContainer from "./components/LoginContainer";
import RegisterContainer from "./components/RegisterContainer";
import { Badge, Brand, ToneSymbol } from "@/components/yome/YomeUI";

export default function Login() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const session = useSession();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "register") {
      setActiveTab("register");
    }
  }, []);

  useEffect(() => {
    if (session?.status === "authenticated") {
      router.push("/dashboard");
    }
  }, [session?.status, router]);

  return (
    <div className="yome-auth-shell">
      <section className="yome-auth-story">
        <Brand href="/" light />
        <div className="yome-auth-message">
          <Badge tone="blue">A social network built for learning</Badge>
          <h1>Find your people.<br />Learn together.</h1>
          <p>Connect with students, educators, and STEM communities that make every question a starting point.</p>
          <div className="mt-8 grid max-w-xl gap-3">
            {[
              ["Focused communities", UsersRound],
              ["Questions that matter", HelpCircle],
              ["Resources and projects", BookOpen],
              ["Live study rooms", FlaskConical],
            ].map(([label, Icon]) => (
              <div key={String(label)} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4">
                <ToneSymbol tone="blue"><Icon className="text-white" size={18} /></ToneSymbol>
                <strong>{String(label)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="yome-auth-panel">
        <div className="yome-auth-form-wrap">
          <div className="mb-8 xl:hidden">
            <Brand href="/" />
          </div>
          <p className="yome-eyebrow">Welcome to Yome</p>
          <h2>{activeTab === "register" ? "Create your learning profile" : "Welcome back"}</h2>
          <p className="mb-6 text-[13px] text-[#64748b]">{activeTab === "register" ? "Join a community where curiosity connects us." : "Continue learning with your communities."}</p>
          <div className="yome-auth-tabs">
            <button className={activeTab === "login" ? "active" : ""} onClick={() => setActiveTab("login")}>Sign in</button>
            <button className={activeTab === "register" ? "active" : ""} onClick={() => setActiveTab("register")}>Sign up</button>
          </div>
          <Suspense fallback={<div className="p-4">Loading...</div>}>
            <LoginContainer activeTab={activeTab} />
            <RegisterContainer setActiveTab={setActiveTab} activeTab={activeTab} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
