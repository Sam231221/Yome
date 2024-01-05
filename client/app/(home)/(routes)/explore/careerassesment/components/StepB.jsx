const StepB = ({
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
              A. What are your strong skills or abilities?
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
          <div className="my-2 flex gap-2">
            <h1 className="text-gray-700">
              B. Do you prefer working independently or in a team?
            </h1>
            <div class="flex items-center gap-3">
              <select class="text-sm focus:outline-none border-[1px] focus:border-secondaryTextColor">
                <option value="">----</option>
                <option value="Independent"> Independent</option>
                <option value="Collaborative">Collaborative</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>
          <div className="my-2 flex gap-2">
            <h1 className="text-gray-700">
              C. How important is work-life balance for you?
            </h1>
            <div class="flex items-center gap-3">
              <select class="text-sm focus:outline-none border-[1px] focus:border-secondaryTextColor">
                <option value="">----</option>

                <option value="Career Focused">Career Focused</option>
                <option value="High priority">High priority</option>
                <option value="Balanced">Balanced</option>
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
        </form>
      </div>
    </div>
  );
};

export default StepB;
