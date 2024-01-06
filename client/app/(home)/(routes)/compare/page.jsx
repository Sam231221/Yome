"use client";
import Image from "next/image";
import axios from "axios";
import { GoPlus } from "react-icons/go";
import React, { useState, useEffect } from "react";

const DynamicInputFields = () => {
  // let institutionsLList = [
  //   { name: "abc", details: "" },
  //   { name: "def", details: "" },
  // ];
  const [institutions, setInstitutions] = useState([]);
  const [inputs, setInputs] = useState([
    {
      id: 1,
      value: "",
      filteredInstitutions: [],
      selectedInstitution: null,
      searchPerformed: false,
      notFound: false,
    }, // Initial input
  ]);

  useEffect(() => {
    const getEIs = async (e) => {
      try {
        let { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_API}/api/ei/getAll`
        );
        setInstitutions(data.institutions);
      } catch (e) {
        console.log(e);
      }
    };
    getEIs();
  }, []);
  console.log(institutions);
  const handleInputChange = (id, value, filterField) => {
    const updatedInputs = inputs.map((input) => {
      if (input.id === id) {
        const filtered = institutions.filter((institution) =>
          institution[filterField].toLowerCase().includes(value.toLowerCase())
        );
        return {
          ...input,
          value,
          filteredInstitutions: filtered,
          searchPerformed: false,
        };
      }
      return input;
    });
    setInputs(updatedInputs);
  };

  const handleCountrySelect = (inputId, institution) => {
    const updatedInputs = inputs.map((input) => {
      if (input.id === inputId) {
        return {
          ...input,
          notFound: institution.notFound,
          selectedInstitution: institution,
          value: institution.name,
          searchPerformed: true,
        };
      }
      return input;
    });
    setInputs(updatedInputs);
  };

  const addInput = (id) => {
    if (inputs.length < 3 && inputs[id - 1].searchPerformed) {
      const newId = inputs.length + 1;
      const newInput = {
        id: newId,
        value: "",
        filteredInstitutions: [],
        selectedInstitution: null,
        searchPerformed: false,
      };
      setInputs([...inputs, newInput]);
    }
  };

  const removeInput = (id) => {
    const updatedInputs = inputs.filter((input) => input.id !== id);
    setInputs(updatedInputs);
  };

  return (
    <div className="p-4">
      {inputs[0].searchPerformed && inputs.length < 3 && (
        <div className="w-full flex justify-end mb-3">
          <button
            className="flex py-3 px-2 items-center justify-center h-[43px] text-white rounded-lg border bg-sky-400  hover:bg-sky-500"
            onClick={() => addInput(inputs[0].id)}
          >
            <GoPlus />
            <span>Add Comparison</span>
          </button>
        </div>
      )}
      <div
        className={`grid ${
          inputs.length === 1
            ? "grid-cols-1"
            : inputs.length === 2
            ? "grid-cols-2"
            : inputs.length === 3
            ? "grid-cols-3"
            : "grid-cols-3"
        } gap-4`}
      >
        {inputs.map((input) => (
          <div key={input.id}>
            <input
              className="w-full font-medium text-lg focus:outline-none text-gray-700 border rounded-md px-4 py-5"
              type="text"
              placeholder="Search for Educational Institution..."
              value={input.value}
              onChange={(e) =>
                handleInputChange(input.id, e.target.value, "name")
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  let searchInstitution = institutions.find(
                    (item) => item.name === e.target.value
                  );

                  if (searchInstitution === undefined) {
                    handleCountrySelect(input.id, {
                      name: input.value,
                      notFound: true,
                    });
                  } else {
                    handleCountrySelect(input.id, {
                      name: input.value,
                      notFound: false,
                    });
                  }
                }
              }}
            />
            {input.filteredInstitutions.length > 0 &&
              !input.searchPerformed && (
                <ul>
                  {input.filteredInstitutions.map((institution, index) => (
                    <li key={index}>
                      <button
                        onClick={() =>
                          handleCountrySelect(input.id, {
                            ...institution,
                            notFound: false,
                          })
                        }
                      >
                        {institution.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            {!input.notFound ? (
              <>
                {input.selectedInstitution && (
                  <div className="border bg-white rounded-sm shadow-lg p-4 mt-4">
                    <div>
                      <Image
                        src={input.selectedInstitution.thumbnail}
                        alt={input.selectedInstitution.name}
                        width={250}
                        height={500}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <h3 className="font-semibold text-gray-800">
                      {input.selectedInstitution.name}
                    </h3>
                    <div className="flex text-xs mb-1">
                      <h1 className="font-semibold text-gray-600">Location:</h1>
                      <p className="text-gray-500 ml-2">
                        {input.selectedInstitution.address}
                      </p>
                    </div>
                    <div className="flex text-xs mb-1">
                      <h1 className="font-semibold text-gray-600">Type:</h1>
                      <p className="text-gray-500 ml-2">
                        {input.selectedInstitution.type}
                      </p>
                    </div>
                    <div className="flex text-xs mb-1">
                      <h1 className="font-semibold text-gray-600">Category:</h1>
                      <p className="text-gray-500 ml-2">
                        {input.selectedInstitution.category}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="border h-[400px] flex items-center justify-center bg-white rounded-sm shadow-lg p-4 mt-4">
                Not Found
              </div>
            )}

            {input.searchPerformed && (
              <button onClick={() => removeInput(input.id)}>Remove</button>
            )}
          </div>
        ))}
      </div>
      {!inputs[0].searchPerformed && (
        <div className="bg-white w-full mt-3 rounded-xl shadow-sm">
          <div className="w-full h-[450px] flex flex-col justify-center items-center">
            <Image
              src="/icon-info.svg"
              alt="SVG Image"
              width={100}
              height={100}
            />
            <h2 className="text-gray-800 text-lg font-semibold">
              Start Typing...
            </h2>
            <p className="text-gray-600 ">
              You can search for a Educational Institution and start comparing
              it with multiple educational institutions.{" "}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicInputFields;
