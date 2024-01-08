import { useEffect, useState } from "react";
import { careerPaths } from "./careerPaths";
const StepFinal = ({ formData }) => {
  const [filteredCareerPaths, setFilteredCareerPaths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const filteredItems = careerPaths.filter((career) => {
      return (
        formData.subjectsActivities.some((item) =>
          career.subjectsActivities.includes(item)
        ) &&
        formData.hobbiesProjects.some((item) =>
          career.hobbiesProjects.includes(item)
        ) &&
        formData.skills.some((item) => career.skills.includes(item)) &&
        (formData.workStyle === "" ||
          career.workStyle === formData.workStyle) &&
        (formData.workLifeBalance === "" ||
          career.workLifeBalance === formData.workLifeBalance) &&
        formData.goals.some((item) => career.goals.includes(item)) &&
        formData.impacts.some((item) => career.impacts.includes(item)) &&
        formData.industryPreferences.some((item) =>
          career.industryPreferences.includes(item)
        ) &&
        formData.longTermGoals.some((item) =>
          career.longTermGoals.includes(item)
        ) &&
        formData.roleModels.some((item) => career.roleModels.includes(item))
      );
    });

    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setFilteredCareerPaths(filteredItems);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [careerPaths, formData]);
  return (
    <div>
      <div className="my-4">
        {!isLoading ? (
          <>
            {filteredCareerPaths.length > 0 ? (
              <>
                {" "}
                <div>
                  <h1 className="mt-2 text-xl font-bold text-blue-900">
                    Available Careers for you:
                  </h1>

                  <div className="flex flex-wrap">
                    {filteredCareerPaths.map((item, i) => (
                      <div key={i} className="w-full sm:w-1/2 py-4  px-2">
                        <div className="border py-4 px-2  shadow-lg bg-white rounded-lg ">
                          <h2 className="text-lg font-bold text-gray-700">
                            {item.title}
                          </h2>
                          <hr />
                          <div className="flex flex-col gap-3 mt-2">
                            <div className="flex">
                              <h1 className="text-gray-600 font-semibold text-sm">
                                Major Roles:
                              </h1>
                              <p className="text-gray-500 text-sm ml-2 ">
                                {item.description}
                              </p>
                            </div>
                            <div className="flex">
                              <h1 className="text-gray-600 font-semibold text-sm">
                                Education:
                              </h1>
                              <p className="text-gray-500 text-sm ml-2 ">
                                {item.education}
                              </p>
                            </div>
                            <div className="flex">
                              <h1 className="text-gray-600 font-semibold text-sm">
                                Salary:
                              </h1>
                              <p className="text-gray-500 text-sm ml-2 ">
                                {item.salaryRange}
                              </p>
                            </div>
                            <div className="flex">
                              <h1 className="text-gray-600 font-semibold text-sm">
                                Required Skills:
                              </h1>
                              <span className="text-gray-500 text-sm ml-2 ">
                                {item.skills.map((i, index) => (
                                  <span className="mr-2" key={index}>
                                    {i},
                                  </span>
                                ))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{ height: "calc(100% - 65px)" }}
                className="w-full  flex flex-col items-center justify-center gap-2"
              >
                <h2 className="text-sm text-gray-500 font-medium">
                  No Relative Carrers Found related to the assessment.
                </h2>
              </div>
            )}
          </>
        ) : (
          <div
            style={{ height: "calc(100% - 65px)" }}
            className="w-full  flex flex-col items-center justify-center gap-2"
          >
            <h3>Loading Possible Career Paths</h3>
            <div class="spinner">
              <svg viewBox="25 25 50 50">
                <circle
                  cx="50"
                  cy="50"
                  r="20"
                  fill="none"
                  class="path"
                ></circle>
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepFinal;
