import React, { useEffect, useState } from "react";

import { signIn } from "next-auth/react";
import { useStateProvider } from "@/context/StateContext";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import FormInput from "@/components/FormInut/Form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
export default function LoginContainer({ activeTab }) {
  const router = useRouter();
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
  const loginWithNextAuthProvider = (e) => {
    let provider = e.target.getAttribute("data-provider");
    console.log("provider", provider);
    signIn(provider, { redirect: false })
      .then((callback) => {
        console.log("callback:", callback);
        if (callback?.error) {
          toast.error("Invalid credentials!");
        }
        if (callback?.ok) {
          router.push("/home");
        }
      })
      .finally(() => console.log("sdsef"));
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
