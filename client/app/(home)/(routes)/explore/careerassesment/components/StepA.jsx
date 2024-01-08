import { useEffect, useState } from "react";
import { subjectsActivities, hobbiesProjects } from "./constants";
const StepA = ({ formData, handleNextStep }) => {
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const handleOnSelectSubjectItem = (e) => {
    let item = e.target.getAttribute("value");
    let copiedSelectedSubjects = Array.from(selectedSubjects);
    if (copiedSelectedSubjects.includes(item)) {
      const index = copiedSelectedSubjects.indexOf(
        e.target.getAttribute("value")
      );
      if (index !== -1) {
        copiedSelectedSubjects.splice(index, 1);
        setSelectedSubjects(copiedSelectedSubjects);
      }
    } else {
      setSelectedSubjects([
        ...selectedSubjects,
        e.target.getAttribute("value"),
      ]);
    }
  };

  const handleOnSelectHobbyItem = (e) => {
    let item = e.target.getAttribute("value");
    let copiedSelectedHobbies = Array.from(selectedHobbies);
    if (copiedSelectedHobbies.includes(item)) {
      const index = copiedSelectedHobbies.indexOf(
        e.target.getAttribute("value")
      );
      if (index !== -1) {
        copiedSelectedHobbies.splice(index, 1);
        setSelectedHobbies(copiedSelectedHobbies);
      }
    } else {
      setSelectedHobbies([...selectedHobbies, e.target.getAttribute("value")]);
    }
  };
  useEffect(() => {
    formData.subjectsActivities = selectedSubjects;
    formData.hobbiesProjects = selectedHobbies;
  }, [selectedHobbies, selectedSubjects]);

  return (
    <div className="w-full  mt-[80px] flex flex-col items-center justify-center">
      <div className="w-[300px] sm:w-[500px]">
        <div className="my-2 w-full">
          <h1 className="text-gray-700">
            A. What subjects or activities do you enjoy the most, both in and
            out of school?
          </h1>

          <div className="mt-3 flex flex-wrap gap-3 items-center">
            {selectedSubjects &&
              subjectsActivities.map((item, i) => (
                <div
                  key={i}
                  value={item}
                  onClick={(e) => handleOnSelectSubjectItem(e)}
                  class={`${
                    selectedSubjects.includes(item)
                      ? "border-sky-400"
                      : "border-gray-300"
                  } text-gray-600 text-center cursor-pointer rounded-full border-[2px] py-2 px-4 text-sm `}
                >
                  {item}
                </div>
              ))}
          </div>
        </div>
        <div className="my-2">
          <h1 className="text-gray-700">
            B. Are there any hobbies or projects you're passionate about?
          </h1>
          <div className="mt-3 flex flex-wrap gap-3 items-center">
            {selectedHobbies &&
              hobbiesProjects.map((item, i) => (
                <div
                  key={i}
                  value={item}
                  onClick={(e) => handleOnSelectHobbyItem(e)}
                  class={`${
                    selectedHobbies.includes(item)
                      ? "border-sky-400"
                      : "border-gray-300"
                  } text-gray-600 text-center cursor-pointer rounded-full border-[2px] py-2 px-4 text-sm `}
                >
                  {item}
                </div>
              ))}
          </div>
        </div>

        <div className="my-2 flex justify-end items-center">
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

export default StepA;
