import React from "react";
import Link from "next/link";
import Image from "next/image";
import useFetchInstitutions from "../../../../../hooks/useFetchInstitutions";
import { InstitutionSkeleton } from "@/components/Loading/Skeletons";
import { CiLocationOn } from "react-icons/ci";
const InsitutionsListings = ({ activeTab }) => {
  const { data: institutions, isLoading, hasErrors } = useFetchInstitutions();
  const filteredInstitutions =
    activeTab === "All"
      ? institutions
      : institutions.filter((institution) => institution.type === activeTab);

  if (isLoading) {
    return (
      <div className="bg-white grid xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <InstitutionSkeleton
          classname={"flex flex-col p-2 shadow-lg"}
          counts={2}
          cards={6}
        />
      </div>
    );
  }
  if (hasErrors) {
    return <div>{hasErrors}</div>;
  }

  return (
    <div className="bg-white grid xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {!isLoading && filteredInstitutions?.length > 0 ? (
        <>
          {filteredInstitutions.map((ei, index) => (
            <div key={index} className="flex flex-col border shadow-lg">
              <div className="relative w-full h-40 overflow-hidden">
                <Image
                  className="transform transition ease-in-out duration-300 hover:scale-110"
                  src={ei.thumbnail}
                  alt="educational institution"
                  width={400}
                  height={500}
                  priority="true"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              <div className="my-2 p-2 leading-tight">
                <Link href="/school">
                  <h2 className="text-[16px] text-gray-700 font-semibold">
                    {ei.name}
                  </h2>
                </Link>
                <hr />
                <div className="">
                  <p className="text-sm  text-gray-600 ">
                    {ei.description.substring(0, 50)}...
                  </p>
                  <div className="flex text-gray-500 gap-1">
                    {" "}
                    <CiLocationOn />
                    <p className="text-xs ">{ei.address}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className=" col-span-3 border items-center justify-center shadow-lg p-4">
          No Educational Institutions found for this category.
        </div>
      )}
    </div>
  );
};
export default InsitutionsListings;
