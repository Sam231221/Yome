import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { REGISTER_USER } from "@/utils/ApiRoutes";
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
  setActiveTab: (tab: "login" | "register") => void;
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

function SocialAuthButton({
  provider,
  children,
  onClick,
}: {
  provider: string;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button type="button" data-provider={provider} onClick={onClick}>
      {children}
    </button>
  );
}

export default function RegisterContainer({
  activeTab,
  setActiveTab,
}: RegisterContainerProps) {
  const [isFormFilled, setFormFill] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl");
  const [values, setValues] = useState<RegisterValues>(emptyValues);

  const inputs = useMemo(
    () => ({
      firstname: {
        pattern: NAME_PATTERN,
        minLength: 2,
        maxLength: 40,
      },
      lastname: {
        pattern: NAME_PATTERN,
        minLength: 2,
        maxLength: 40,
      },
      username: {
        pattern: USERNAME_PATTERN,
        minLength: 3,
        maxLength: 24,
      },
      email: {
        pattern: EMAIL_PATTERN,
      },
      password: {
        pattern: PASSWORD_PATTERN,
        minLength: 8,
        maxLength: 64,
      },
    }),
    []
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
    e: React.MouseEvent<HTMLButtonElement>
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
    <div className={activeTab === "register" ? "" : "hidden"}>
      <form onSubmit={handleRegisterFormSubmit} method="POST">
        <label>
          <span>First name</span>
          <input
            name="firstname"
            type="text"
            placeholder="Maya"
            required
            autoComplete="given-name"
            pattern={inputs.firstname.pattern}
            minLength={inputs.firstname.minLength}
            maxLength={inputs.firstname.maxLength}
            value={values.firstname}
            onChange={onChangeFormInputs}
          />
        </label>
        <label>
          <span>Last name</span>
          <input
            name="lastname"
            type="text"
            placeholder="Patel"
            required
            autoComplete="family-name"
            pattern={inputs.lastname.pattern}
            minLength={inputs.lastname.minLength}
            maxLength={inputs.lastname.maxLength}
            value={values.lastname}
            onChange={onChangeFormInputs}
          />
        </label>
        <label>
          <span>Username</span>
          <input
            name="username"
            type="text"
            placeholder="mayacodes"
            required
            autoComplete="username"
            pattern={inputs.username.pattern}
            minLength={inputs.username.minLength}
            maxLength={inputs.username.maxLength}
            value={values.username}
            onChange={onChangeFormInputs}
          />
        </label>
        <label>
          <span>Email address</span>
          <input
            name="email"
            type="email"
            placeholder="maya@example.com"
            required
            autoComplete="email"
            pattern={inputs.email.pattern}
            value={values.email}
            onChange={onChangeFormInputs}
          />
        </label>
        <label>
          <span>Password</span>
          <div className="password-field">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              pattern={inputs.password.pattern}
              minLength={inputs.password.minLength}
              maxLength={inputs.password.maxLength}
              value={values.password}
              onChange={onChangeFormInputs}
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <label>
          <span>Confirm password</span>
          <div className="password-field">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={onChangeFormInputs}
            />
            <button type="button" onClick={() => setShowConfirmPassword((value) => !value)}>
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <label className="auth-checkbox">
          <input
            checked={isChecked}
            onChange={handleCheckboxChange}
            type="checkbox"
            name="terms"
            id="terms"
          />
          <span>
            I agree to the Terms of Service and Privacy Policy.
          </span>
        </label>
        <button
          type="submit"
          disabled={!isFormFilled || !isChecked || isSubmitting}
          className="primary-button auth-submit"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <div className="auth-divider">
        <span>or continue with</span>
      </div>
      <div className="social-auth">
        <SocialAuthButton provider="google" onClick={loginWithNextAuthProvider}>
          <strong><FcGoogle size={15} /></strong> Google
        </SocialAuthButton>
        <SocialAuthButton provider="github" onClick={loginWithNextAuthProvider}>
          <strong><FaGithub size={15} /></strong> Github
        </SocialAuthButton>
        <SocialAuthButton provider="facebook" onClick={loginWithNextAuthProvider}>
          <strong><FaFacebook size={15} color="#1e5aff" /></strong> Facebook
        </SocialAuthButton>
      </div>
      <p className="auth-terms">
        By continuing, you agree to Yome&apos;s Terms and acknowledge the Privacy Policy.
      </p>
    </div>
  );
}
