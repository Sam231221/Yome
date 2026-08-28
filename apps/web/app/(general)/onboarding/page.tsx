"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Plus, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, Brand, ToneSymbol } from "@/components/yome/YomeUI";
import { onboardingGoals, onboardingInterests } from "@/lib/yome/data";

type OnboardingState = {
  username: string;
  educationLevel: string;
  bio: string;
  interests: string[];
  topics: string[];
  goals: string[];
};

const defaultState: OnboardingState = {
  username: "",
  educationLevel: "undergraduate",
  bio: "",
  interests: ["Technology", "Mathematics"],
  topics: ["Artificial Intelligence", "Python"],
  goals: ["Learn new skills"],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(defaultState);

  useEffect(() => {
    const stored = localStorage.getItem("yome:onboarding");
    if (stored) {
      setValues({ ...defaultState, ...JSON.parse(stored) });
    }
  }, []);

  const toggleList = (key: "interests" | "topics" | "goals", value: string) => {
    setValues((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });
  };

  const finish = () => {
    localStorage.setItem("yome:onboarding", JSON.stringify(values));
    router.push("/dashboard");
  };

  return (
    <div className="yome-onboarding-shell">
      <header className="yome-onboarding-top">
        <Brand href="/dashboard" />
        <span className="text-[10px] font-bold text-[#64748b]">Step {step} of 3</span>
        <button className="justify-self-end border-0 bg-transparent text-[10px] font-bold text-[#2563eb]" onClick={finish}>Save & exit</button>
      </header>
      <div className="yome-progress-track"><i style={{ width: `${(step / 3) * 100}%` }} /></div>
      <main className="yome-onboarding-main">
        {step === 1 && (
          <>
            <p className="yome-eyebrow">Build your academic identity</p>
            <h1>Tell us about yourself</h1>
            <p className="mb-8 text-[14px] text-[#64748b]">This helps Yome personalize your learning network.</p>
            <div className="mb-8 flex items-center gap-5">
              <Avatar initials="YO" tone="violet" size="lg" />
              <button className="yome-button-secondary"><Plus size={16} /> Add profile image</button>
            </div>
            <div className="yome-two-grid">
              <label className="yome-form">
                <span>Username</span>
                <input className="yome-input" value={values.username} onChange={(event) => setValues((current) => ({ ...current, username: event.target.value }))} placeholder="mayacodes" />
              </label>
              <label className="yome-form">
                <span>Education level</span>
                <select className="yome-select" value={values.educationLevel} onChange={(event) => setValues((current) => ({ ...current, educationLevel: event.target.value }))}>
                  <option value="secondary">Secondary school</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="postgraduate">Postgraduate</option>
                  <option value="educator">Educator</option>
                  <option value="independent">Independent learner</option>
                </select>
              </label>
              <label className="yome-form md:col-span-2">
                <span>Short biography</span>
                <textarea className="yome-textarea" value={values.bio} onChange={(event) => setValues((current) => ({ ...current, bio: event.target.value }))} placeholder="Computer Science student exploring AI, robotics, and human-centered technology." />
              </label>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <p className="yome-eyebrow">Make Yome yours</p>
            <h1>What interests you?</h1>
            <p className="mb-8 text-[14px] text-[#64748b]">Select at least two areas. You can refine your topics later.</p>
            <div className="yome-choice-grid">
              {onboardingInterests.map((item) => {
                const selected = values.interests.includes(item.name);
                return (
                  <button key={item.name} className={selected ? "yome-choice selected" : "yome-choice"} onClick={() => toggleList("interests", item.name)}>
                    <ToneSymbol tone={item.tone}>{item.symbol}</ToneSymbol>
                    <span><strong>{item.name}</strong><small className="block text-[10px] text-[#64748b]">{item.detail}</small></span>
                    <i>{selected ? "✓" : "+"}</i>
                  </button>
                );
              })}
            </div>
            <div className="mt-8">
              <span className="text-[11px] font-bold text-[#64748b]">Suggested topics</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Artificial Intelligence", "Python", "Robotics", "Data Science", "Calculus", "Cybersecurity"].map((topic) => (
                  <button key={topic} className="yome-button-secondary min-h-8 text-[11px]" onClick={() => toggleList("topics", topic)}>
                    {values.topics.includes(topic) ? "✓" : "+"} {topic}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <p className="yome-eyebrow">Your learning journey</p>
            <h1>What brings you to Yome?</h1>
            <p className="mb-8 text-[14px] text-[#64748b]">Choose as many as you like.</p>
            <div className="yome-choice-grid">
              {onboardingGoals.map((goal) => {
                const selected = values.goals.includes(goal);
                return (
                  <button key={goal} className={selected ? "yome-choice selected" : "yome-choice"} onClick={() => toggleList("goals", goal)}>
                    <ToneSymbol tone="blue"><UsersRound size={17} /></ToneSymbol>
                    <strong>{goal}</strong>
                    <i>{selected ? "✓" : "+"}</i>
                  </button>
                );
              })}
            </div>
          </>
        )}
        <footer className="yome-onboarding-actions">
          <button className="yome-button-secondary" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>Back</button>
          <span className="flex gap-2">{[1, 2, 3].map((item) => <i key={item} className={`block h-2 rounded-full ${step === item ? "w-5 bg-[#2563eb]" : "w-2 bg-[#cbd5e1]"}`} />)}</span>
          <button className="yome-button-primary justify-self-end" onClick={() => (step === 3 ? finish() : setStep((current) => current + 1))}>
            {step === 3 ? "Finish setup" : "Continue"} <ArrowRight size={16} />
          </button>
        </footer>
      </main>
    </div>
  );
}
