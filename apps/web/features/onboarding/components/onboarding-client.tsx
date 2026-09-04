"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingReferencePage } from "@/features/onboarding/components/OnboardingReferencePage";

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

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(defaultState);

  useEffect(() => {
    const stored = localStorage.getItem("yome:onboarding");
    if (stored) {
      setValues({ ...defaultState, ...JSON.parse(stored) });
    }
  }, []);

  const finish = () => {
    localStorage.setItem("yome:onboarding", JSON.stringify(values));
    router.push("/dashboard");
  };

  return (
    <OnboardingReferencePage
      values={values}
      step={step}
      setStep={setStep}
      setValues={setValues}
      finish={finish}
    />
  );
}
