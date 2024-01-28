import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { REGISTER_USER } from "@/utils/ApiRoutes";
import FormInput from "@/components/FormInut/Form";

export default function RegisterContainer({ activeTab, setActiveTab }) {
  const [IsFormFilled, setFormFill] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [values, setValues] = useState({
    username: "",
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const inputs = [
    {
      id: 1,
      name: "firstname",
      type: "text",
      placeholder: "Your Firstname",
      errorMessage:
        "Firstname should be 3-16 characters and shouldn't include any special character!",
      pattern: "^[A-Za-z0-9]{3,16}$",
      required: true,
    },
    {
      id: 2,
      name: "lastname",
      type: "text",
      placeholder: "Your Lastname",
      errorMessage:
        "Lastname should be 3-16 characters and shouldn't include any special character!",
      pattern: "^[A-Za-z0-9]{3,16}$",
      required: true,
    },
    {
      id: 3,
      name: "username",
      type: "text",
      placeholder: "Username",
      errorMessage:
        "Username should be 3-16 characters and shouldn't include any special character!",
      pattern: "^[A-Za-z0-9]{3,16}$",
      required: true,
    },
    {
      id: 4,
      name: "email",
      type: "email",
      placeholder: "Email",
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
      errorMessage: "It should be a valid email address!",
      required: true,
    },
    {
      id: 5,
      name: "password",
      type: "password",
      placeholder: "Password",
      errorMessage:
        "Password should be 8-20 characters and include at least 1 letter, 1 number and 1 special character!",
      pattern: `^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$`,
      required: true,
    },
    {
      id: 6,
      name: "confirmPassword",
      type: "password",
      placeholder: "Confirm Password",
      errorMessage: "Passwords don't match!",
      pattern: values.password,
      required: true,
    },
  ];
  const handleCheckboxChange = (e) => {
    setIsChecked(e.target.checked);
  };
  useEffect(() => {
    if (
      values.firstname !== "" &&
      values.lastname !== "" &&
      values.email !== "" &&
      values.username !== "" &&
      values.password !== "" &&
      values.password !== ""
    ) {
      setFormFill(true);
    } else {
      setFormFill(false);
    }
  }, [values]);

  const onChangeFormInputs = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  //Register Users
  const handleRegisterFormSubmit = async (e) => {
    e.preventDefault();
    const { data } = await axios.post(REGISTER_USER, {
      email: values.email,
      firstname: values.firstname,
      lastname: values.lastname,
      username: values.username,
      password: values.password,
    });
    setValues({
      firstname: "",
      lastname: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    if (data.status === 200) {
      toast.success(data.msg);
      setActiveTab("login");
    }
    if (data.status === 400 || data.status === 409) {
      toast.error(data.msg);
    }
  };
  return (
    <div
      className={`${
        activeTab === "register" ? "flex flex-col" : "hidden"
      }  p-3 gap-y-2`}
    >
      <div
        data-provider="facebook"
        onClick={(e) => loginWithNextAuthProvider(e)}
        className="text-sm border cursor-pointer border-[#0e517e63] flex py-3 px-2  "
      >
        <FaFacebook size={20} className="ml-3 mr-3 text-[#1e5aff] " />
        <span className="text-sm pointer-events-none font-medium">
          Continue With Facebook
        </span>
      </div>

      <div
        data-provider="github"
        onClick={(e) => loginWithNextAuthProvider(e)}
        className="text-sm border cursor-pointer border-[#0e517e63] flex py-3 px-2  "
      >
        <FaGithub size={20} className="ml-3 mr-3  " />
        <span className="text-sm pointer-events-none font-medium">
          Continue With Github
        </span>
      </div>
      <div
        data-provider="google"
        onClick={(e) => loginWithNextAuthProvider(e)}
        className="text-sm border cursor-pointer border-[#0e517e63] flex py-3 px-2"
      >
        <FcGoogle size={20} className="ml-3 mr-3 text-[#1e5aff] " />
        <span className="text-sm pointer-events-none font-medium">
          Continue With Google
        </span>
      </div>
      <p className="text-center text-sm font-medium">Or</p>

      {/* register form */}
      <form onSubmit={handleRegisterFormSubmit} method="POST">
        {inputs.map((input) => (
          <FormInput
            key={input.id}
            {...input}
            value={values[input.name]}
            onChange={onChangeFormInputs}
            enableErrorMsg={true}
          />
        ))}

        <div className="flex my-3">
          <input
            checked={isChecked}
            onChange={handleCheckboxChange}
            type="checkbox"
            className="mr-2 "
            name="terms"
            id="terms"
          />
          <label className="text-sm " htmlFor="terms">
            I agree to the terms of service and privacy
          </label>
        </div>
        <button
          type="submit"
          disabled={IsFormFilled && isChecked ? false : true}
          className={`${
            IsFormFilled && isChecked ? "bg-[#0e24a0]" : "bg-[#b6b6b6]"
          } hover:bg-blue-700 w-full font-medium text-sm text-white py-3 px-2`}
        >
          Continue{" >"}
        </button>
      </form>
    </div>
  );
}
