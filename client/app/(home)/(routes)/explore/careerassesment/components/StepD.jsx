import { useEffect, useState } from "react";
import { longTermGoals, roleModels } from "./constants";
const StepD = ({ formData, handlePrevStep, handleNextStep }) => {
  const [selectedLongTerms, setSelectedLongTerms] = useState([]);
  const [selectedRoleModels, setSelectedRoleModels] = useState([]);
  const handleOnSelectLongTermItem = (e) => {
    let item = e.target.getAttribute("value");
    let copiedSelectedLongTerms = Array.from(selectedLongTerms);
    if (copiedSelectedLongTerms.includes(item)) {
      const index = copiedSelectedLongTerms.indexOf(
        e.target.getAttribute("value")
      );
      if (index !== -1) {
        copiedSelectedLongTerms.splice(index, 1);
        setSelectedLongTerms(copiedSelectedLongTerms);
      }
    } else {
      setSelectedLongTerms([
        ...selectedLongTerms,
        e.target.getAttribute("value"),
      ]);
    }
  };

  const handleOnSelectRoleModelItem = (e) => {
    let item = e.target.getAttribute("value");
    let copiedSelectedRoleModels = Array.from(selectedRoleModels);
    if (copiedSelectedRoleModels.includes(item)) {
      const index = copiedSelectedRoleModels.indexOf(
        e.target.getAttribute("value")
      );
      if (index !== -1) {
        copiedSelectedRoleModels.splice(index, 1);
        setSelectedRoleModels(copiedSelectedRoleModels);
      }
    } else {
      setSelectedRoleModels([
        ...selectedRoleModels,
        e.target.getAttribute("value"),
      ]);
    }
  };
  useEffect(() => {
    formData.longTermGoals = selectedLongTerms;
    formData.roleModels = selectedRoleModels;
  }, [selectedRoleModels, selectedLongTerms]);

  return (
    <div className="w-full mt-[80px]  flex flex-col items-center justify-center">
      <div className="max-w-[500px]">
        <div className="my-2">
          <h1 className="text-gray-700">
            A. Where do you see yourself in 5 or 10 years?
          </h1>
          <div className="mt-3 flex flex-wrap gap-3 items-center">
            {selectedLongTerms &&
              longTermGoals.map((item, i) => (
                <div
                  key={i}
                  value={item}
                  onClick={(e) => handleOnSelectLongTermItem(e)}
                  class={`${
                    selectedLongTerms.includes(item)
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
            B. Are there any professionals or role models whose careers you
            admire?
          </h1>
          <div className="mt-3 flex flex-wrap gap-3 items-center">
            {selectedRoleModels &&
              roleModels.map((item, i) => (
                <div
                  key={i}
                  value={item}
                  onClick={(e) => handleOnSelectRoleModelItem(e)}
                  class={`${
                    selectedRoleModels.includes(item)
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

export default StepD;
