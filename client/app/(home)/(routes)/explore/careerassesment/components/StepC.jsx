const StepC = ({
  formData,
  handleChangeInput,
  handlePrevStep,
  handleNextStep,
}) => {
  return (
    <div className="w-full  mt-[80px] flex flex-col items-center justify-center">
      <div className="max-w-[500px]">
        <form className="mt-5" action="">
          <div className="my-2">
            <h1 className="text-gray-700">
              A. Are there specific goals or achievements you aspire to in your
              career?
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
              B. What kind of impact do you hope to make through your work?
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
              C. Are there specific industries or settings that attract you more
              (e.g., healthcare, technology, arts)?
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

export default StepC;
