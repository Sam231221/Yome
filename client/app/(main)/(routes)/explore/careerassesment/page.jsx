import React from "react";
import SimpleMultiStepForm from "./components/MultiStepForm";
export default function CareerAssesmentPage() {
  return (
    <div className=" p-3 w-full flex justify-center items-center">
      {" "}
      <SimpleMultiStepForm showStepNumber={true} />
    </div>
  );
}
