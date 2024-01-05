const StepE = ({
  formData,
  handleChangeInput,
  handlePrevStep,
  handleSubmitFormData,
}) => {
  return (
    <div className="w-full  h-full flex flex-col items-center justify-center">
      <div className=" overflow-auto" style={{ height: "calc(100% - 120px)" }}>
        <div className="mt-3">
          <h1 className="text-gray-500 font-bold text-lg">A. Interests</h1>
          <DataConfirmRow
            label="Subjects/Activities:"
            value={formData.firstName}
          />
          <DataConfirmRow
            label="Hobbies/Projects:"
            value={formData.firstName}
          />
        </div>
        <div className="mt-3">
          <h1 className="text-gray-500 font-bold text-lg">
            B. Skills ,Strengths and Work Prefreneces{" "}
          </h1>
          <DataConfirmRow
            label="Skills/Abilities:"
            value={formData.firstName}
          />
          <DataConfirmRow
            label="Working Preferences:"
            value={formData.firstName}
          />
          <DataConfirmRow
            label="Work-life Importance:"
            value={formData.firstName}
          />
        </div>

        <div className="mt-3">
          <h1 className="text-gray-500 font-bold text-lg">
            C. Personal Values and Motivations{" "}
          </h1>
          <DataConfirmRow
            label="Goals/Achievements:"
            value={formData.firstName}
          />
          <DataConfirmRow label="FutureImpacts:" value={formData.firstName} />
          <DataConfirmRow
            label="PreferedIndustries:"
            value={formData.firstName}
          />
        </div>

        <div className="mt-3">
          <h1 className="text-gray-500 font-bold text-lg">
            D. Future Outlook and Interests{" "}
          </h1>
          <DataConfirmRow label="Outlooks:" value={formData.firstName} />
          <DataConfirmRow label="RoleModels:" value={formData.firstName} />
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
const DataConfirmRow = ({ label, value }) => {
  return (
    <div className="my-3 border border-dashed border-gray-200 p-1 rounded-lg">
      <span className="mr-4 text-slate-500">{label}</span>
      <span className="mr-4 text-slate-900">{value}</span>
    </div>
  );
};
