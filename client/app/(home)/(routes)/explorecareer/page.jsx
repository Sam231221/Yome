"use client";

const ExploreCareers = () => {
  return (
    <div className="p-8">
      <div className="section-title">
        <h2 className="text-ternaryTextColor">Explore</h2>
        <p className="text-primaryTextColor">Career Paths</p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-1 cursor-pointer relative p-5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-pink-500">
          <div className="h-[250px] flex justify-center items-center text-center">
            <div className="z-[2]">
              <h2 className="text-white text-xl font-semibold">
                Interactive Career Assessment
              </h2>
              <p className="text-xs text-gray-200">
                Assessment tool that asks you about your interests, skills, and
                strengths to sugggest potential career paths that align with
                their profile
              </p>
            </div>
            <h1 className="absolute z-[1] font-bold right-2 top-[25%]  text-gray-600 text-[120px]">
              1
            </h1>
          </div>
        </div>
        <div class="col-span-1 cursor-pointer relative p-5 bg-gradient-to-r from-indigo-400 to-teal-500 hover:from-emerald-400 hover:to-cyan-400">
          <div className="h-[250px] flex justify-center items-center text-center">
            <div className="z-[2]">
              <h2 className="text-white text-xl font-semibold">
                Success Stories
              </h2>
              <p className="text-xs text-gray-200">
                Showcase of success stories of individuals who have pursued
                unconventional or unique career paths
              </p>
            </div>
            <h1 className="absolute z-[1] font-bold right-2 top-[25%]  text-gray-600 text-[120px]">
              2
            </h1>
          </div>
        </div>
        <div class="col-span-2 cursor-pointer relative p-5 text-center flex justify-center ">
          <div class="w-3/4 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-rose-400 hover:to-red-500  p-4">
            <div className="h-[250px] relative flex justify-center items-center text-center">
              <div className="z-[2]">
                <h2 className="text-white text-xl font-semibold">
                  Career Visualization
                </h2>
                <p className="text-xs text-gray-200">
                  visit visual roadmap or flowchart illustrating different
                  career pathways within specific industries or fields.
                </p>
              </div>
              <h1 className="absolute z-[1] font-bold right-2 top-[25%]  text-gray-600 text-[120px]">
                3
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ExploreCareers;
