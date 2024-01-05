import React from "react";
import SimpleMultiStepForm from "./components/MultiStepForm";
export default function CareerAssesmentPage() {
  return (
    <div
      className=" p-3 w-full flex justify-center items-center"
      style={{ height: "calc(100vh - 60px )" }}
    >
      {" "}
      <SimpleMultiStepForm showStepNumber={true} />
    </div>
  );
}
