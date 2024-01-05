const StepD = ({
  formData,
  handleChangeInput,
  handlePrevStep,
  handleNextStep,
}) => {
  return (
    <div className="w-full mt-[80px]  flex flex-col items-center justify-center">
      <div className="max-w-[500px]">
        <form className="mt-5" action="">
          <div className="my-2">
            <h1 className="text-gray-700">
              A. Where do you see yourself in 5 or 10 years?
            </h1>
            <div className="mt-3 flex">
              <span
                onClick={(e) => handleSelectItem(e)}
                class="text-gray-600 cursor-pointer rounded-full border-[2px]  p-2 px-4 text-sm border-gray-300"
              >
                Bunjee jumping
              </span>
            </div>
          </div>
          <div className="my-2 ">
            <h1 className="text-gray-700">
              B. Are there any professionals or role models whose careers you
              admire?
            </h1>
            <div className="mt-3 flex">
              <span
                onClick={(e) => handleSelectItem(e)}
                class="text-gray-600 cursor-pointer rounded-full border-[2px]  p-2 px-4 text-sm border-gray-300"
              >
                Bunjee jumping
              </span>
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
        </form>
      </div>
    </div>
  );
};

export default StepD;

// A Seperate component to show data
const DataConfirmRow = ({ label, value }) => {
  return (
    <div className="my-3 border border-dashed border-gray-200 p-1 rounded-lg">
      <span className="mr-4 text-slate-500">{label}</span>
      <span className="mr-4 text-slate-900">{value}</span>
    </div>
  );
};
