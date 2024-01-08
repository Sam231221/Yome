import { useState, useEffect } from "react";
import { goals, impacts, industryPreferences } from "./constants";
const StepC = ({ formData, handlePrevStep, handleNextStep }) => {
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedImpacts, setSelectedImpacts] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const handleOnSelectGoalsItem = (e) => {
    let item = e.target.getAttribute("value");
    let copiedSelectedGoals = Array.from(selectedGoals);
    if (copiedSelectedGoals.includes(item)) {
      const index = copiedSelectedGoals.indexOf(e.target.getAttribute("value"));
      if (index !== -1) {
        copiedSelectedGoals.splice(index, 1);
        setSelectedGoals(copiedSelectedGoals);
      }
    } else {
      setSelectedGoals([...selectedGoals, e.target.getAttribute("value")]);
    }
  };

  const handleOnSelectImpactItem = (e) => {
    let item = e.target.getAttribute("value");
    let copiedSelectedImpacts = Array.from(selectedImpacts);
    if (copiedSelectedImpacts.includes(item)) {
      const index = copiedSelectedImpacts.indexOf(
        e.target.getAttribute("value")
      );
      if (index !== -1) {
        copiedSelectedImpacts.splice(index, 1);
        setSelectedImpacts(copiedSelectedImpacts);
      }
    } else {
      setSelectedImpacts([...selectedImpacts, e.target.getAttribute("value")]);
    }
  };

  const handleOnSelectIndustryItem = (e) => {
    let item = e.target.getAttribute("value");
    let copiedSelectedIndustries = Array.from(selectedIndustries);
    if (copiedSelectedIndustries.includes(item)) {
      const index = copiedSelectedIndustries.indexOf(
        e.target.getAttribute("value")
      );
      if (index !== -1) {
        copiedSelectedIndustries.splice(index, 1);
        setSelectedIndustries(copiedSelectedIndustries);
      }
    } else {
      setSelectedIndustries([
        ...selectedIndustries,
        e.target.getAttribute("value"),
      ]);
    }
  };
  useEffect(() => {
    formData.goals = selectedGoals;
    formData.impacts = selectedImpacts;
    formData.industryPreferences = selectedIndustries;
  }, [selectedImpacts, selectedGoals, selectedIndustries]);
  return (
    <div className="w-full  mt-[80px] flex flex-col items-center justify-center">
      <div className="max-w-[500px]">
        <div className="my-2">
          <h1 className="text-gray-700">
            A. Are there specific goals or achievements you aspire to in your
            career?
          </h1>
          <div className="mt-3 flex flex-wrap gap-3 items-center">
            {selectedGoals &&
              goals.map((item, i) => (
                <div
                  key={i}
                  value={item}
                  onClick={(e) => handleOnSelectGoalsItem(e)}
                  class={`${
                    selectedGoals.includes(item)
                      ? "border-sky-400"
                      : "border-gray-300"
                  } text-gray-600 text-center cursor-pointer rounded-full border-[2px] py-2 px-4 text-sm `}
                >
                  {item}
                </div>
              ))}
          </div>
        </div>
        <div className="my-2 ">
          <h1 className="text-gray-700">
            B. What kind of impact do you hope to make through your work?
          </h1>
          <div className="mt-3 flex flex-wrap gap-3 items-center">
            {selectedImpacts &&
              impacts.map((item, i) => (
                <div
                  key={i}
                  value={item}
                  onClick={(e) => handleOnSelectImpactItem(e)}
                  class={`${
                    selectedImpacts.includes(item)
                      ? "border-sky-400"
                      : "border-gray-300"
                  } text-gray-600 text-center cursor-pointer rounded-full border-[2px] py-2 px-4 text-sm `}
                >
                  {item}
                </div>
              ))}
          </div>
        </div>
        <div className="my-2 ">
          <h1 className="text-gray-700">
            C. Are there specific industries or settings that attract you more
            (e.g., healthcare, technology, arts)?
          </h1>
          <div className="mt-3 flex flex-wrap gap-3 items-center">
            {selectedIndustries &&
              industryPreferences.map((item, i) => (
                <div
                  key={i}
                  value={item}
                  onClick={(e) => handleOnSelectIndustryItem(e)}
                  class={`${
                    selectedIndustries.includes(item)
                      ? "border-sky-400"
                      : "border-gray-300"
                  } text-gray-600 text-center cursor-pointer rounded-full border-[2px] py-2 px-4 text-sm `}
                >
                  {item}
                </div>
              ))}
          </div>
        </div>

        <div className="my-2 flex justify-between items-center">
          <button
            className="bg-gray-400 text-white px-4 py-2 rounded-xl"
            onClick={handlePrevStep}
          >
            Prev
          </button>
          <button
            className="bg-sky-700 text-white px-4 py-2 rounded-xl"
            onClick={handleNextStep}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepC;
