import React, { useEffect, useState } from "react";
import axios from "axios";
import { signIn } from "next-auth/react";
import { useStateProvider } from "@/context/StateContext";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { reducerCases } from "@/context/constants";
import { GET_USER_ROUTE } from "@/utils/ApiRoutes";

import FormInput from "@/components/FormInut/Form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
export default function LoginContainer({ activeTab }) {
  const router = useRouter();
  const [{ userInfo, newUser }, dispatch] = useStateProvider();
  const [IsFormFilled, setFormFill] = useState(false);
  const [values, setValues] = useState({
    email: "",
    password: "",
  });
  const inputs = [
    {
      id: 1,
      name: "email",
      type: "email",
      placeholder: "Email",
      required: true,
    },
    {
      id: 2,
      name: "password",
      type: "password",
      placeholder: "Password",
      required: true,
    },
  ];
  useEffect(() => {
    if (values.email !== "" && values.password !== "") {
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
    let data;
    if (e.target.getAttribute("data-provider") === "facebook") {
      data = await signIn("facebook", { redirect: "/" });
    }
    if (e.target.getAttribute("data-provider") === "google") {
      data = await signIn("google", { redirect: true });
    }
    if (e.target.getAttribute("data-provider") === "github") {
      data = await signIn("github");
    }
    console.log(data);
    if (data?.error) {
      toast.error("Credentials error!");
    } else {
      router.push("/");
    }
    //check if the user with this email already exist or not?
    if (email) {
      const { data } = await axios.post(GET_USER_ROUTE, {
        email,
      });

      // It means User with the email doesnt already exist
      // So, set newUser to true and  userInfo from the Google Account info
      // Finally Go to '/onboarding' route

      if (!data.error) {
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
  };

  //Login with Credentials
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const data = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    });
    console.log(data);
    if (data?.error) {
      toast.error("Credentials error!");
    } else {
      toast.success("Login Successfully");
      router.push("/");
    }
  };
  return (
    <div
      className={`${
        activeTab === "login" ? "flex flex-col" : "hidden"
      } mt-5 gap-y-2`}
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

      {/* login form */}
      <form onSubmit={handleFormSubmit}>
        {inputs.map((input) => (
          <FormInput
            key={input.id}
            {...input}
            value={values[input.name]}
            onChange={onChangeFormInputs}
          />
        ))}

        <a className="mb-3 block text-sm focus:underline" href="#">
          Forgot your password?
        </a>
        <button
          type="submit"
          disabled={IsFormFilled ? false : true}
          className={`${
            IsFormFilled ? "bg-[#0e24a0]" : "bg-[#7599ff]"
          } w-full font-medium text-sm text-white py-3 px-2`}
        >
          Sign In {" >"}
        </button>
      </form>
    </div>
  );
}
