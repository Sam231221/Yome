"use client";

import { useCallback, type ReactNode } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

type SocialProvider = "google" | "github" | "facebook";

function SocialAuthButton({
  provider,
  children,
  onClick,
}: {
  provider: SocialProvider;
  children: ReactNode;
  onClick: (provider: SocialProvider) => void;
}) {
  return (
    <button type="button" onClick={() => onClick(provider)}>
      {children}
    </button>
  );
}

export function useAuthRedirect(defaultPath = "/dashboard") {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  return useCallback(() => {
    if (callbackUrl === null) {
      router.push(defaultPath);
      return;
    }

    window.location.href = callbackUrl;
  }, [callbackUrl, defaultPath, router]);
}

export function useSocialAuth(defaultPath = "/dashboard") {
  const redirectAfterAuth = useAuthRedirect(defaultPath);

  return useCallback(
    async (provider: SocialProvider) => {
      const callback = await signIn(provider, { redirect: false });
      if (callback?.error) {
        toast.error("Unable to sign in with that provider right now.");
        return;
      }

      if (callback?.ok) {
        toast.success("Signed in successfully.");
        redirectAfterAuth();
      }
    },
    [redirectAfterAuth]
  );
}

export function SocialAuthButtons() {
  const loginWithProvider = useSocialAuth();

  return (
    <>
      <div className="auth-divider">
        <span>or continue with</span>
      </div>
      <div className="social-auth">
        <SocialAuthButton provider="google" onClick={loginWithProvider}>
          <strong>
            <FcGoogle size={15} />
          </strong>{" "}
          Google
        </SocialAuthButton>
        <SocialAuthButton provider="github" onClick={loginWithProvider}>
          <strong>
            <FaGithub size={15} />
          </strong>{" "}
          Github
        </SocialAuthButton>
        <SocialAuthButton provider="facebook" onClick={loginWithProvider}>
          <strong>
            <FaFacebook size={15} color="#1e5aff" />
          </strong>{" "}
          Facebook
        </SocialAuthButton>
      </div>
    </>
  );
}

export function AuthTerms() {
  return (
    <p className="auth-terms">
      By continuing, you agree to Yome&apos;s Terms and acknowledge the Privacy
      Policy.
    </p>
  );
}
