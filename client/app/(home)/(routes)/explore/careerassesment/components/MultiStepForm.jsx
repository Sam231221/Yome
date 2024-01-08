"use client";
import React, { useEffect, useState } from "react";
import StepA from "./StepA";
import StepB from "./StepB";
import StepC from "./StepC";
import StepD from "./StepD";
import StepE from "./StepE";
import StepFinal from "./StepFinal";

// parent component tol control and manage steps and data

const initialFormData = {
  subjectsActivities: [],
  hobbiesProjects: [],
  skills: [],
  workStyle: "",
  workLifeBalance: "",
  goals: [],
  impacts: [],
  industryPreferences: [],
  longTermGoals: [],
  roleModels: [],
};

const stepsArray = [
  {
    serialNo: "A",
    title: "Interests",
  },
  {
    serialNo: "B",
    title: "Skills and Strengths",
  },
  {
    serialNo: "C",
    title: "Personal Values and Motivations",
  },
  {
    serialNo: "D",
    title: "Future Outlook ",
  },
  {
    serialNo: "E",
    title: "Final",
  },
];

const SimpleMultiStepForm = ({ showStepNumber }) => {
  const [step, setStep] = useState("A");
  const [formData, setFormData] = useState(initialFormData);

  const handleNextStep = () => {
    if (step === "A") setStep("B");
    else if (step === "B") setStep("C");
    else if (step === "C") setStep("D");
    else if (step === "D") setStep("E");
  };

  const handlePrevStep = () => {
    if (step === "E") setStep("D");
    else if (step === "D") setStep("C");
    else if (step === "C") setStep("B");
    else if (step === "B") setStep("A");
  };

  // We need a method to update our formData
  const handleChangeInput = (event) => {
    const fieldName = event.target.name;
    let fieldValue;
    if (fieldName === "agreeToTerms") {
      fieldValue = event.target.checked;
    } else {
      fieldValue = event.target.value;
    }
    setFormData({
      ...formData,
      [fieldName]: fieldValue,
    });
  };

  // We need a method to do final operation
  const handleSubmitFormData = () => {
    // Here You can do final Validation and then Submit Your form
    if (!formData) {
      alert("Error!!!!!!");
    } else {
      setStep("Final");
    }
  };

  useEffect(() => {
    console.log("yo:", formData);
  }, [formData]);

  // Section for render StepNumbers
  const renderTopStepNumbers = () => {
    if (!showStepNumber || step === "Final") {
      return null;
    }
    return (
      <div className="flex justify-between items-center">
        {stepsArray.map((item, i) => (
          <div
            onClick={() => setStep(item)}
            key={i}
            className={`${
              i !== stepsArray.length - 1 ? "basis-full" : ""
            } flex items-center `}
          >
            <div className="relative flex flex-col items-center text-teal-600">
              <div
                className={`rounded-full transition duration-500 ease-in-out border-2 border-gray-300 h-12 w-12 flex items-center justify-center 
                    ${
                      item.serialNo === step
                        ? "bg-sky-500 text-white font-bold border border-sky-4"
                        : ""
                    }`}
              >
                {item === step ? (
                  <span className="text-white font-bold text-xl">&#10003;</span>
                ) : (
                  i + 1
                )}
              </div>
              <div
                className={`absolute hidden sm:block top-full mt-2 text-center w-32 text-xs font-medium uppercase ${
                  item.serialNo === step ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {item.title}
              </div>
            </div>

            <div
              className={`basis-full border-t-2 transition duration-500 ease-in-out ${
                item.serialNo === step ? "border-sky-400" : "border-gray-300"
              }`}
            ></div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-[900px] h-full max-w-full px-6 py-3 mx-auto rounded-lg border shadow-lg bg-white">
      {renderTopStepNumbers()}

      {/* // Render Steps */}
      {step === "A" ? (
        <StepA
          formData={formData}
          handleChangeInput={handleChangeInput}
          handleNextStep={handleNextStep}
        />
      ) : null}
      {step === "B" ? (
        <StepB
          formData={formData}
          handleChangeInput={handleChangeInput}
          handlePrevStep={handlePrevStep}
          handleNextStep={handleNextStep}
        />
      ) : null}
      {step === "C" ? (
        <StepC
          formData={formData}
          handleChangeInput={handleChangeInput}
          handlePrevStep={handlePrevStep}
          handleNextStep={handleNextStep}
        />
      ) : null}
      {step === "D" ? (
        <StepD
          formData={formData}
          handleChangeInput={handleChangeInput}
          handlePrevStep={handlePrevStep}
          handleNextStep={handleNextStep}
        />
      ) : null}
      {step === "E" ? (
        <StepE
          formData={formData}
          handleChangeInput={handleChangeInput}
          handlePrevStep={handlePrevStep}
          handleSubmitFormData={handleSubmitFormData}
        />
      ) : null}
      {step === "Final" ? <StepFinal formData={formData} /> : null}
    </div>
  );
};

export default SimpleMultiStepForm;
