"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  FileText,
  Headphones,
  HelpCircle,
  MessageCircle,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Settings,
  Share2,
  Users,
  UsersRound,
  Video,
} from "lucide-react";
import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Avatar, Badge } from "@/components/ui";
import { groups, onboardingGoals, onboardingInterests, type YomeTone } from "@/features/learning/data";
import { discoveryGroups, GroupCard, MembersGrid, QuestionCard } from "./shared";

export function OnboardingReferencePage({
  values,
  step,
  setStep,
  setValues,
  finish,
}: {
  values: {
    username: string;
    educationLevel: string;
    bio: string;
    interests: string[];
    topics: string[];
    goals: string[];
  };
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  setValues: Dispatch<SetStateAction<{
    username: string;
    educationLevel: string;
    bio: string;
    interests: string[];
    topics: string[];
    goals: string[];
  }>>;
  finish: () => void;
}) {
  const toggle = (key: "interests" | "topics" | "goals", value: string) =>
    setValues((current) => {
      const list = current[key];
      return { ...current, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });

  const goalIcons = ["↗", "◎", "?", "◇", "○", "✦"];

  return (
    <div className="onboarding-shell min-h-dvh bg-yome-bg text-yome-text">
      <header className="onboarding-top">
        <Link className="auth-brand" href="/dashboard">
          <span className="brand-mark">Y</span>
          <span>yome</span>
        </Link>
        <span>Step {step} of 3</span>
        <button onClick={finish}>Save & exit</button>
      </header>
      <div className="progress-track"><i style={{ width: `${(step / 3) * 100}%` }} /></div>
      <main className="onboarding-main">
        {step === 1 ? (
          <>
            <p className="eyebrow">Build your academic identity</p>
            <h1>Tell us about yourself</h1>
            <p className="onboarding-lead">This helps Yome personalize your learning network.</p>
            <div className="avatar-picker">
              <Avatar initials="MP" tone="violet" size="lg" />
              <button><Plus size={16} /> Add profile image</button>
            </div>
            <div className="profile-fields">
              <label>
                <span>Username</span>
                <div className="prefix-field">
                  <b>@</b>
                  <input value={values.username} onChange={(event) => setValues((current) => ({ ...current, username: event.target.value }))} placeholder="mayacodes" />
                </div>
              </label>
              <label>
                <span>Education level</span>
                <select value={values.educationLevel} onChange={(event) => setValues((current) => ({ ...current, educationLevel: event.target.value }))}>
                  <option value="secondary">Secondary school</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="postgraduate">Postgraduate</option>
                  <option value="educator">Educator</option>
                  <option value="other">Independent learner</option>
                </select>
              </label>
              <label className="wide">
                <span>Short biography</span>
                <textarea value={values.bio} onChange={(event) => setValues((current) => ({ ...current, bio: event.target.value }))} placeholder="Computer Science student exploring AI, robotics, and human-centered technology." />
                <small>Help others understand what you&apos;re learning.</small>
              </label>
            </div>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <p className="eyebrow">Make Yome yours</p>
            <h1>What interests you?</h1>
            <p className="onboarding-lead">Select at least two areas. You can refine your topics later.</p>
            <div className="interest-grid">
              {onboardingInterests.map((item) => {
                const active = values.interests.includes(item.name);
                return (
                  <button key={item.name} className={`${item.tone} ${active ? "selected" : ""}`} onClick={() => toggle("interests", item.name)}>
                    <span className="interest-symbol">{item.symbol}</span>
                    <span><strong>{item.name}</strong><small>{item.detail}</small></span>
                    <i>{active ? "✓" : "+"}</i>
                  </button>
                );
              })}
            </div>
            <div className="topic-picks">
              <span>Suggested topics</span>
              <div>
                {["Artificial Intelligence", "Python", "Robotics", "Data Science", "Calculus", "Cybersecurity"].map((topic) => (
                  <button key={topic} onClick={() => toggle("topics", topic)}>
                    {values.topics.includes(topic) ? "✓" : "+"} {topic}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <p className="eyebrow">Your learning journey</p>
            <h1>What brings you to Yome?</h1>
            <p className="onboarding-lead">Choose as many as you like.</p>
            <div className="goal-list">
              {onboardingGoals.map((goal, index) => (
                <button key={goal} className={values.goals.includes(goal) ? "selected" : ""} onClick={() => toggle("goals", goal)}>
                  <span>{goalIcons[index]}</span>
                  <strong>{goal}</strong>
                  <i>{values.goals.includes(goal) ? "✓" : "+"}</i>
                </button>
              ))}
            </div>
            <div className="onboarding-note">
              <UsersRound size={20} />
              <p>
                <strong>Your network starts with shared curiosity.</strong>
                <br />
                We&apos;ll recommend people and groups based on these choices, not popularity.
              </p>
            </div>
          </>
        ) : null}
        <footer className="onboarding-actions">
          <button className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>Back</button>
          <span>{[1, 2, 3].map((item) => <i key={item} className={step === item ? "active" : ""} />)}</span>
          <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white" onClick={() => (step === 3 ? finish() : setStep((current) => current + 1))}>
            {step === 3 ? "Finish setup" : "Continue"} <ArrowRight size={16} />
          </button>
        </footer>
      </main>
    </div>
  );
}
