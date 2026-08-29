"use client";
import React, { Suspense, useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoginContainer from "./components/LoginContainer";
import RegisterContainer from "./components/RegisterContainer";
import Link from "next/link";

function Avatar({
  initials,
  tone = "blue",
}: {
  initials: string;
  tone?: "blue" | "teal" | "amber" | "violet";
}) {
  return <span className={`avatar avatar-${tone} avatar-md`}>{initials}</span>;
}

function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "teal" | "amber" | "violet" | "neutral";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default function Login() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
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
    <div className="auth-shell">
      <section className="auth-story">
        <Link className="auth-brand" href="/">
          <span className="brand-mark">Y</span>
          <span>yome</span>
        </Link>
        <div className="auth-orbit" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="orbit-dot dot-one">S</span>
          <span className="orbit-dot dot-two">&lt;/&gt;</span>
          <span className="orbit-dot dot-three">A</span>
          <span className="orbit-dot dot-four">E</span>
        </div>
        <div className="auth-message">
          <Badge tone="blue">A social network built for learning</Badge>
          <h1>
            Find your people.
            <br />
            Learn together.
          </h1>
          <p>
            Connect with students, educators, and STEM communities that make every
            question a starting point.
          </p>
          <div className="auth-proof">
            <div className="proof-avatars">
              <Avatar initials="SC" tone="teal" />
              <Avatar initials="AN" tone="amber" />
              <Avatar initials="PS" tone="violet" />
            </div>
            <span>
              <strong>12,000+ learners</strong>
              <small>sharing knowledge every day</small>
            </span>
          </div>
        </div>
      </section>

      <section className="auth-panel flex min-w-0 items-center justify-center bg-yome-surface">
        <Link className="auth-close inline-grid place-items-center rounded-full text-yome-muted" href="/" aria-label="Close authentication">
          <span>x</span>
        </Link>
        <div className="auth-form-wrap">
          <p className="eyebrow">Welcome to Yome</p>
          <h2>{activeTab === "register" ? "Create your learning profile" : "Welcome back"}</h2>
          <p className="auth-subtitle">
            {activeTab === "register"
              ? "Join a community where curiosity connects us."
              : "Continue learning with your communities."}
          </p>
          <div className="auth-tabs grid grid-cols-2 rounded-yome bg-yome-surface-2">
            <button className={activeTab === "register" ? "active rounded-yome font-bold" : "rounded-yome font-bold"} onClick={() => setActiveTab("register")}>
              Sign up
            </button>
            <button className={activeTab === "login" ? "active rounded-yome font-bold" : "rounded-yome font-bold"} onClick={() => setActiveTab("login")}>
              Sign in
            </button>
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
