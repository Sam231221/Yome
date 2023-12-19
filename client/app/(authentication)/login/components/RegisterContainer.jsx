import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  GithubAuthProvider,
} from "firebase/auth";
import { toast } from "react-hot-toast";
import { firebaseAuth } from "@/utils/FirebaseConfig";
import { useStateProvider } from "@/context/StateContext";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { reducerCases } from "@/context/constants";
import { GET_USER_ROUTE } from "@/utils/ApiRoutes";
import { onBoardUserRoute } from "@/utils/ApiRoutes";

import FormInput from "@/components/FormInut/Form";
import { useRouter } from "next/navigation";
export default function RegisterContainer({ activeTab, setActiveTab }) {
  const router = useRouter();
  const [{ userInfo, newUser }, dispatch] = useStateProvider();
  const [IsFormFilled, setFormFill] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const inputs = [
    {
      id: 1,
      name: "username",
      type: "text",
      placeholder: "Username",
      errorMessage:
        "Username should be 3-16 characters and shouldn't include any special character!",
      pattern: "^[A-Za-z0-9]{3,16}$",
      required: true,
    },
    {
      id: 2,
      name: "email",
      type: "email",
      placeholder: "Email",
      errorMessage: "It should be a valid email address!",
      required: true,
    },
    {
      id: 3,
      name: "password",
      type: "password",
      placeholder: "Password",
      errorMessage:
        "Password should be 8-20 characters and include at least 1 letter, 1 number and 1 special character!",
      pattern: `^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$`,
      required: true,
    },
    {
      id: 4,
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

  //Login with  Next Auth Provider
  const loginWithNextAuthProvider = async (e) => {
    let provider;
    if (e.target.getAttribute("data-provider") === "facebook") {
      provider = new FacebookAuthProvider();
    }
    if (e.target.getAttribute("data-provider") === "google") {
      provider = new GoogleAuthProvider();
    }
    if (e.target.getAttribute("data-provider") === "github") {
      provider = new GithubAuthProvider();
    }
    const {
      user: { displayName: name, password, email, photoURL: profileImage },
    } = await signInWithPopup(firebaseAuth, provider);
    try {
      console.log("pw:", password, " email:", email);
      //check if the user with this email already exist or not?
      if (email) {
        const { data } = await axios.post(GET_USER_ROUTE, {
          email,
        });

        // It means User with the email doesnt already exist
        // So, set newUser to true and  userInfo from the Google Account info
        // Finally Go to '/onboarding' route

        if (!data.status) {
          dispatch({ type: reducerCases.SET_NEW_USER, newUser: true });
          dispatch({
            type: reducerCases.SET_USER_INFO,
            userInfo: {
              name,
              email,
              profileImage,
              status: "Available",
            },
          });
          router.push("/onboarding");
        } else {
          // It means User with the email  already exist
          //Instead set userInfo from the database
          // And Go to '/' route

          dispatch({
            type: reducerCases.SET_USER_INFO,
            userInfo: {
              id: data.data.id,
              email: data.data.email,
              name: data.data.name,
              profileImage: data.data.profilePicture,
              status: data.data.about,
            },
          });
          router.push("/");
        }
      }
    } catch (error) {
      console.log({ error });
    }
  };

  //Register Users
  const handleRegisterFormSubmit = async (e) => {
    e.preventDefault();
    const { data } = await axios.post(onBoardUserRoute, {
      email: values.email,
      username: values.username,
      password: values.password,
    });
    setValues({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    if (data.status === 200) {
      toast.success(data.msg);
      setTimeout(() => {
        toast.success("Check your email for further verification");
      }, 3000);
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
          } w-full font-medium text-sm text-white py-3 px-2`}
        >
          Continue{" >"}
        </button>
      </form>
    </div>
  );
}
