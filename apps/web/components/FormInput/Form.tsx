import {
  useState,
  type FocusEvent,
  type InputHTMLAttributes,
} from "react";
import "./FormInput.css";

type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id?: number | string;
  label?: string;
  errorMessage?: string;
  readOnly?: boolean;
  enableErrorMsg?: boolean;
};

function FormInput(props: FormInputProps) {
  const [focused, setFocused] = useState(false);
  const {
    label,
    errorMessage,
    readOnly,
    enableErrorMsg,
    onChange,
    id,
    ...inputProps
  } = props;

  const handleFocus = (_event: FocusEvent<HTMLInputElement>) => {
    setFocused(true);
  };

  return (
    <div
      className={`${
        enableErrorMsg ? "enable-errorMsg" : ""
      } flex flex-col w-full`}
    >
      {label !== undefined && (
        <label className="text-gray-600 font-medium">
          {capitalizeFirstLetter(label)}
        </label>
      )}
      <input
        readOnly={readOnly}
        className={`${
          readOnly === true
            ? "bg-gray-300 text-gray-500 rounded-lg"
            : `bg-white
        focus:border-[#0e24a0]`
        } w-full  py-3 px-2 mb-2 text-sm 
        focus:outline-none border border-gray-200 font-medium`}
        id={typeof id === "undefined" ? undefined : String(id)}
        {...inputProps}
        onChange={onChange}
        onBlur={handleFocus}
        onFocus={() =>
          inputProps.name === "confirmPassword" && setFocused(true)
        }
        data-focused={focused.toString()}
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
function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
