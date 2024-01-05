import { useState, useEffect } from "react";
import { skills, workStyle, workLifeBalance } from "./constants";
const StepB = ({ formData, handlePrevStep, handleNextStep }) => {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedWorkStyle, setSelectedWorkStyle] = useState("");
  const [selectedWorkLifeBalance, setSelectedWorkLifeBalance] = useState("");
  const handleOnSelectSkillItem = (e) => {
    let item = e.target.getAttribute("value");
    let copiedSelectedSkills = Array.from(selectedSkills);
    if (copiedSelectedSkills.includes(item)) {
      const index = copiedSelectedSkills.indexOf(
        e.target.getAttribute("value")
      );
      if (index !== -1) {
        copiedSelectedSkills.splice(index, 1);
        setSelectedSkills(copiedSelectedSkills);
      }
    } else {
      setSelectedSkills([...selectedSkills, e.target.getAttribute("value")]);
    }
  };

  const handleOnSelectWorkStyleItem = (e) => {
    setSelectedWorkStyle(e.target.value);
  };

  const handleOnSelectWorkLifeBalanceItem = (e) => {
    // console.log(e.target.getAttribute("value"));
    //works because its form element
    // console.log(e.target.value);
    setSelectedWorkLifeBalance(e.target.value);
  };
  useEffect(() => {
    formData.skills = selectedSkills;
    formData.workStyle = selectedWorkStyle;
    formData.workLifeBalance = selectedWorkLifeBalance;
  }, [selectedSkills, selectedWorkLifeBalance, selectedWorkStyle]);

  return (
    <div className="w-full mt-[80px]  flex flex-col items-center justify-center">
      <div className="max-w-[500px]">
        <div className="my-2">
          <h1 className="text-gray-700">
            A. What are your strong skills or abilities?
          </h1>
          <div className="mt-3 flex flex-wrap gap-3 items-center">
            {selectedSkills &&
              skills.map((item, i) => (
                <div
                  key={i}
                  value={item}
                  onClick={(e) => handleOnSelectSkillItem(e)}
                  class={`${
                    selectedSkills.includes(item)
                      ? "border-sky-400"
                      : "border-gray-300"
                  } text-gray-600 text-center cursor-pointer rounded-full border-[2px] py-2 px-4 text-sm `}
                >
                  {item}
                </div>
              ))}
          </div>
        </div>
        <div className="my-2 flex gap-2">
          <h1 className="text-gray-700">
            B. Do you prefer working independently or in a team?
          </h1>
          <div class="flex items-center gap-3">
            <select
              value={selectedWorkStyle}
              onChange={(e) => handleOnSelectWorkStyleItem(e)}
              class="text-sm focus:outline-none border-[1px] focus:border-secondaryTextColor"
            >
              {workStyle.map((item, i) => (
                <option key={i} value={item}>
                  {" "}
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="my-2 flex gap-2">
          <h1 className="text-gray-700">
            C. How important is work-life balance for you?
          </h1>
          <div class="flex items-center gap-3">
            <select
              value={selectedWorkLifeBalance}
              onChange={(e) => handleOnSelectWorkLifeBalanceItem(e)}
              class="text-sm focus:outline-none border-[1px] focus:border-secondaryTextColor"
            >
              {workLifeBalance.map((item, i) => (
                <option key={i} value={item}>
                  {item}
                </option>
              ))}
            </select>
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

export default StepB;
