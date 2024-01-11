import { useState } from "react";
import "./FormInput.css";
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function FormInput(props) {
  const [focused, setFocused] = useState(false);
  const { label, errorMessage, enableErrorMsg, onChange, id, ...inputProps } =
    props;

  const handleFocus = (e) => {
    setFocused(true);
  };

  return (
    <div
      className={`${
        enableErrorMsg ? "enable-errorMsg" : ""
      } flex flex-col w-full`}
    >
      {label !== "" && (
        <label className="text-gray-600 font-medium">
          {capitalizeFirstLetter(label)}
        </label>
      )}
      <input
        className="w-full  py-3 px-2 mb-2 text-sm bg-white
        focus:border-[#0e24a0]
        focus:outline-none border border-gray-200 font-medium"
        {...inputProps}
        onChange={onChange}
        onBlur={handleFocus}
        onFocus={() =>
          inputProps.name === "confirmPassword" && setFocused(true)
        }
        focused={focused.toString()}
      />
      {errorMessage && (
        <span className="text-xs hidden font-medium text-red-600 ">
          {errorMessage}
        </span>
      )}
    </div>
  );
}

export default FormInput;
