import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { REGISTER_USER } from "@/utils/ApiRoutes";
import FormInput from "@/components/FormInput/Form";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  CONFIRM_PASSWORD_ERROR_MESSAGE,
  EMAIL_PATTERN,
  NAME_PATTERN,
  normalizeEmail,
  normalizeText,
  PASSWORD_ERROR_MESSAGE,
  PASSWORD_PATTERN,
  passwordsMatch,
  USERNAME_PATTERN,
} from "@/lib/auth/formValidation";

interface RegisterContainerProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

type RegisterValues = {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const emptyValues: RegisterValues = {
  username: "",
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterContainer({
  activeTab,
  setActiveTab,
}: RegisterContainerProps) {
  const [isFormFilled, setFormFill] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl");
  const [values, setValues] = useState<RegisterValues>(emptyValues);

  const inputs = useMemo(
    () => [
      {
        id: 1,
        name: "firstname",
        type: "text",
        placeholder: "First name",
        errorMessage:
          "First name must be 2-40 characters and can include letters, spaces, apostrophes, or hyphens.",
        pattern: NAME_PATTERN,
        minLength: 2,
        maxLength: 40,
        required: true,
        autoComplete: "given-name",
      },
      {
        id: 2,
        name: "lastname",
        type: "text",
        placeholder: "Last name",
        errorMessage:
          "Last name must be 2-40 characters and can include letters, spaces, apostrophes, or hyphens.",
        pattern: NAME_PATTERN,
        minLength: 2,
        maxLength: 40,
        required: true,
        autoComplete: "family-name",
      },
      {
        id: 3,
        name: "username",
        type: "text",
        placeholder: "Username",
        errorMessage:
          "Username must be 3-24 characters and may include letters, numbers, dots, underscores, @, or hyphens.",
        pattern: USERNAME_PATTERN,
        minLength: 3,
        maxLength: 24,
        required: true,
        autoComplete: "username",
      },
      {
        id: 4,
        name: "email",
        type: "email",
        placeholder: "Email address",
        pattern: EMAIL_PATTERN,
        errorMessage: "Enter a valid email address.",
        required: true,
        autoComplete: "email",
      },
      {
        id: 5,
        name: "password",
        type: "password",
        placeholder: "Password",
        errorMessage: PASSWORD_ERROR_MESSAGE,
        pattern: PASSWORD_PATTERN,
        minLength: 8,
        maxLength: 64,
        required: true,
        autoComplete: "new-password",
      },
      {
        id: 6,
        name: "confirmPassword",
        type: "password",
        placeholder: "Confirm password",
        errorMessage: CONFIRM_PASSWORD_ERROR_MESSAGE,
        required: true,
        autoComplete: "new-password",
      },
    ],
    [values.password]
  );

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
  };

  useEffect(() => {
    setFormFill(
      values.firstname.trim() !== "" &&
        values.lastname.trim() !== "" &&
        values.email.trim() !== "" &&
        values.username.trim() !== "" &&
        values.password !== "" &&
        values.confirmPassword !== "" &&
        passwordsMatch(values.password, values.confirmPassword)
    );
  }, [values]);

  const onChangeFormInputs = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const loginWithNextAuthProvider = async (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const provider = e.currentTarget.getAttribute("data-provider");
    if (!provider) return;

    const callback = await signIn(provider, { redirect: false });
    if (callback?.error) {
      toast.error("Unable to sign in with that provider right now.");
      return;
    }
    if (callback?.ok) {
      toast.success("Signed in successfully.");
      if (callbackUrl === null) {
        router.push("/dashboard");
      } else {
        window.location.href = callbackUrl;
      }
    }
  };

  const handleRegisterFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!passwordsMatch(values.password, values.confirmPassword)) {
      toast.error(CONFIRM_PASSWORD_ERROR_MESSAGE);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(
        REGISTER_USER,
        {
          email: normalizeEmail(values.email),
          firstname: normalizeText(values.firstname),
          lastname: normalizeText(values.lastname),
          username: normalizeText(values.username),
          password: values.password,
        },
        { validateStatus: () => true }
      );
      const { data } = response;
      if (response.status === 201) {
        const callback = await signIn("credentials", {
          redirect: false,
          email: normalizeEmail(values.email),
          password: values.password,
        });
        setValues(emptyValues);
        toast.success(data.msg || "Account created successfully.");
        if (callback?.ok) {
          router.push("/onboarding");
          return;
        }
        setActiveTab("login");
        return;
      }
      if (response.status === 400 || response.status === 409) {
        toast.error(data.error || data.msg || "Registration failed.");
        return;
      }
      toast.error(data?.error || data?.msg || "Registration failed.");
    } catch {
      toast.error("We couldn't create your account right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`${
        activeTab === "register" ? "flex flex-col" : "hidden"
      } gap-y-3`}
    >
      <div
        data-provider="facebook"
        onClick={loginWithNextAuthProvider}
        className="yome-button-secondary w-full justify-start"
      >
        <FaFacebook size={20} className="ml-3 mr-3 text-[#1e5aff] " />
        <span className="text-sm pointer-events-none font-medium">
          Continue With Facebook
        </span>
      </div>

      <div
        data-provider="github"
        onClick={loginWithNextAuthProvider}
        className="yome-button-secondary w-full justify-start"
      >
        <FaGithub size={20} className="ml-3 mr-3  " />
        <span className="text-sm pointer-events-none font-medium">
          Continue With Github
        </span>
      </div>
      <div
        data-provider="google"
        onClick={loginWithNextAuthProvider}
        className="yome-button-secondary w-full justify-start"
      >
        <FcGoogle size={20} className="ml-3 mr-3 text-[#1e5aff] " />
        <span className="text-sm pointer-events-none font-medium">
          Continue With Google
        </span>
      </div>
      <p className="text-center text-[10px] font-bold uppercase tracking-wider text-[var(--yome-muted)]">or continue with email</p>

      <form onSubmit={handleRegisterFormSubmit} method="POST">
        {inputs.map((input) => (
          <FormInput
            key={input.id}
            {...input}
            value={values[input.name as keyof RegisterValues]}
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
            I agree to the Terms of Service and Privacy Policy.
          </label>
        </div>
        <button
          type="submit"
          disabled={!isFormFilled || !isChecked || isSubmitting}
          className="yome-button-primary w-full"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
