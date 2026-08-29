import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { normalizeEmail } from "@/lib/auth/formValidation";

interface LoginContainerProps {
  activeTab: string;
}

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

export default function LoginContainer({ activeTab }: LoginContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl");

  const [isFormFilled, setFormFill] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    setFormFill(values.email.trim() !== "" && values.password !== "");
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
      if (callbackUrl === null) {
        router.push("/dashboard");
      } else {
        window.location.href = callbackUrl;
      }
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
