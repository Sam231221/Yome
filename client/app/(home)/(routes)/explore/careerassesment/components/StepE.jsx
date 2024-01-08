import { useEffect } from "react";

const StepE = ({
  formData,

  handlePrevStep,
  handleSubmitFormData,
}) => {
  useEffect(() => {
    console.log("sdsdf:", formData);
  }, []);
  return (
    <div className="w-full  h-full flex mt-14 flex-col items-center justify-center">
      <div className=" overflow-auto">
        <div className="mt-3">
          <h1 className="text-gray-500 font-bold text-lg">A. Interests</h1>
          <DataConfirmArrayRow
            label="Subjects/Activities:"
            value={formData.subjectsActivities}
          />
          <DataConfirmArrayRow
            label="Hobbies/Projects:"
            value={formData.hobbiesProjects}
          />
        </div>
        <div className="mt-3">
          <h1 className="text-gray-500 font-bold text-lg">
            B. Skills ,Strengths and Work Prefreneces{" "}
          </h1>
          <DataConfirmArrayRow
            label="Skills/Abilities:"
            value={formData.skills}
          />
          <DataConfirmRow
            label="Working Preferences:"
            value={formData.workStyle}
          />
          <DataConfirmRow
            label="Work-life Importance:"
            value={formData.workLifeBalance}
          />
        </div>

        <div className="mt-3">
          <h1 className="text-gray-500 font-bold text-lg">
            C. Personal Values and Motivations{" "}
          </h1>
          <DataConfirmArrayRow
            label="Goals/Achievements:"
            value={formData.goals}
          />
          <DataConfirmArrayRow
            label="FutureImpacts:"
            value={formData.impacts}
          />
          <DataConfirmArrayRow
            label="PreferedIndustries:"
            value={formData.industryPreferences}
          />
        </div>

        <div className="mt-3">
          <h1 className="text-gray-500 font-bold text-lg">
            D. Future Outlook and Interests{" "}
          </h1>
          <DataConfirmArrayRow
            label="Outlooks:"
            value={formData.longTermGoals}
          />
          <DataConfirmArrayRow
            label="RoleModels:"
            value={formData.roleModels}
          />
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
            onClick={handleSubmitFormData}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepE;

// A Seperate component to show data
const DataConfirmArrayRow = ({ label, value }) => {
  return (
    <div className="my-3 border border-dashed border-gray-200 p-1 rounded-lg">
      <span className="mr-4 text-slate-600">{label}</span>
      <span className="mr-4 text-slate-500">
        {value.map((item, i) => (
          <>{item}, </>
        ))}
      </span>
    </div>
  );
};

const DataConfirmRow = ({ label, value }) => {
  return (
    <div className="my-3 border border-dashed border-gray-200 p-1 rounded-lg">
      <span className="mr-4 text-slate-600">{label}</span>
      <span className="mr-4 text-slate-500">{value}</span>
    </div>
  );
};
