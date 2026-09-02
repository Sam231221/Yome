import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { normalizeEmail } from "@/lib/auth/formValidation";
import {
  AuthTerms,
  SocialAuthButtons,
  useAuthRedirect,
} from "@/features/auth/components/social-auth";

interface LoginContainerProps {
  activeTab: string;
}

export default function LoginContainer({ activeTab }: LoginContainerProps) {
  const [isFormFilled, setFormFill] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState({
    email: "",
    password: "",
  });
  const redirectAfterAuth = useAuthRedirect();

  useEffect(() => {
    setFormFill(values.email.trim() !== "" && values.password !== "");
  }, [values]);

  const onChangeFormInputs = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await signIn("credentials", {
        redirect: false,
        email: normalizeEmail(values.email),
        password: values.password,
      });
      if (data?.error) {
        toast.error("Sign-in failed. Check your email and password.");
        return;
      }

      toast.success("Signed in successfully.");
      redirectAfterAuth();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={activeTab === "login" ? "" : "hidden"}>
      <form onSubmit={handleFormSubmit}>
        <label>
          <span>Email address</span>
          <input
            name="email"
            type="email"
            placeholder="maya@example.com"
            required
            autoComplete="email"
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
              autoComplete="current-password"
              value={values.password}
              onChange={onChangeFormInputs}
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <button className="forgot-link font-bold text-yome-blue" type="button">
          Forgot password?
        </button>
        <button
          type="submit"
          disabled={!isFormFilled || isSubmitting}
          className="primary-button auth-submit inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <SocialAuthButtons />
      <AuthTerms />
    </div>
  );
}
