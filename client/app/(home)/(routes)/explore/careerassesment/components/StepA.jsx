const StepA = ({ formData, handleChangeInput, handleNextStep }) => {
  return (
    <div className="w-full  mt-[80px] flex flex-col items-center justify-center">
      <div className="max-w-[500px]">
        <div className="my-2">
          <h1 className="text-gray-700">
            A. What subjects or activities do you enjoy the most, both in and
            out of school?
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
        <div className="my-2">
          <h1 className="text-gray-700">
            B. Are there any hobbies or projects you're passionate about?
          </h1>
          <div className="mt-3 flex">
            <span class=" text-gray-600 cursor-pointer rounded-full border-[2px]  p-2 px-4 text-sm border-gray-300">
              Bunjee jumping
            </span>
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
