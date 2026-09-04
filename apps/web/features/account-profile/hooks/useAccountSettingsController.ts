"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthState } from "@/features/auth/providers/AuthStateProvider";
import {
  changeAccountPassword,
  getAccountErrorMessage,
  updateAccountDetails,
} from "@/features/account-profile/api/accountApi";
import {
  ensureUserInfo,
  logUserInfoLoadError,
} from "@/lib/auth/userInfo";
import {
  CONFIRM_PASSWORD_ERROR_MESSAGE,
  normalizeEmail,
  normalizeText,
  PASSWORD_ERROR_MESSAGE,
  PASSWORD_PATTERN,
  passwordsMatch,
} from "@/lib/auth/formValidation";
import {
  buildAccountSettingsValues,
  DEFAULT_ACCOUNT_PREFS,
  DEFAULT_ACCOUNT_SETTINGS_VALUES,
  isSettingsTab,
  type AccountPrefs,
  type AccountSettingsValues,
  type SettingsTab,
} from "@/features/account-profile/lib/account-settings";

export function useAccountSettingsController() {
  const [{ userInfo }, { setUserInfo }] = useAuthState();
  const { data: session } = useSession();
  const router = useRouter();
  const securitySectionRef = useRef<HTMLElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const savedTimerRef = useRef<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [values, setValues] = useState<AccountSettingsValues>(
    DEFAULT_ACCOUNT_SETTINGS_VALUES
  );
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [isSecurityFocused, setIsSecurityFocused] = useState(false);
  const [updatedDetails, setUpdatedDetails] = useState(false);
  const [isSecurityFormValid, setIsSecurityFormValid] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [darkPreview, setDarkPreview] = useState(false);
  const [pic, setPic] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(
    "/avatars/userprofile.png"
  );
  const [prefs, setPrefs] = useState<AccountPrefs>(DEFAULT_ACCOUNT_PREFS);

  const displayName = useMemo(() => {
    const fullName = [values.firstname, values.lastname]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");
    return fullName || userInfo?.name || values.username || "Yome learner";
  }, [userInfo?.name, values.firstname, values.lastname, values.username]);

  const avatarInitials = useMemo(() => {
    return (
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "Y"
    );
  }, [displayName]);

  const syncSavedState = () => {
    setSaved(true);
    if (savedTimerRef.current) {
      window.clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = window.setTimeout(() => setSaved(false), 2200);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!session?.user || userInfo) return;
        await ensureUserInfo({
          sessionUser: session.user,
          currentUserInfo: userInfo,
          setUserInfo,
        });
      } catch (error) {
        if (!cancelled) {
          logUserInfoLoadError("account page session bootstrap", error);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [session?.user, setUserInfo, userInfo]);

  useEffect(() => {
    setValues((current) => ({
      ...current,
      ...buildAccountSettingsValues(userInfo),
    }));
    setUpdatedDetails(false);
    setAvatarPreview(userInfo?.profilePicture || "/avatars/userprofile.png");
    setPic(null);
  }, [userInfo]);

  useEffect(() => {
    const syncTabFromUrl = () => {
      const requestedTab = new URLSearchParams(window.location.search).get(
        "tab"
      );

      if (requestedTab === "security") {
        setActiveTab("account");
        setIsSecurityFocused(true);
        return;
      }
      if (isSettingsTab(requestedTab)) {
        setActiveTab(requestedTab);
        setIsSecurityFocused(false);
        return;
      }

      setActiveTab("account");
      setIsSecurityFocused(false);
    };

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);

    return () => {
      window.removeEventListener("popstate", syncTabFromUrl);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "account" && isSecurityFocused) {
      securitySectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [activeTab, isSecurityFocused]);

  useEffect(() => {
    const passwordFieldsMatch = values.newPassword === values.confirmPassword;
    const newPasswordIsStrong = new RegExp(PASSWORD_PATTERN).test(
      values.newPassword
    );

    setIsSecurityFormValid(
      Boolean(
        values.currentPassword &&
          values.newPassword &&
          values.confirmPassword &&
          passwordFieldsMatch &&
          newPasswordIsStrong
      )
    );
  }, [values.confirmPassword, values.currentPassword, values.newPassword]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        window.clearTimeout(savedTimerRef.current);
      }
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const updatePrefs = (key: keyof AccountPrefs, value: boolean) => {
    setPrefs((current) => ({ ...current, [key]: value }));
  };

  const handleNavTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setIsSecurityFocused(false);
    router.replace(`/account?tab=${tab}`);
  };

  const handleAccountInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    const nextValues = { ...values, [name]: value };
    const initialValues = buildAccountSettingsValues(userInfo);
    setValues(nextValues);
    setUpdatedDetails(
      nextValues.email !== initialValues.email ||
        nextValues.username !== initialValues.username ||
        nextValues.bio !== initialValues.bio ||
        nextValues.firstname !== initialValues.firstname ||
        nextValues.lastname !== initialValues.lastname ||
        nextValues.address !== initialValues.address ||
        Boolean(pic)
    );
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(nextFile);
    previewUrlRef.current = nextPreviewUrl;
    setPic(nextFile);
    setAvatarPreview(nextPreviewUrl);
    setUpdatedDetails(true);
  };

  const handleRemoveAvatar = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPic(null);
    setAvatarPreview(userInfo?.profilePicture || "/avatars/userprofile.png");
    setUpdatedDetails(
      values.email !== (userInfo?.email || "") ||
        values.username !== (userInfo?.username || "") ||
        values.bio !== (userInfo?.bio || "") ||
        values.firstname !== (userInfo?.firstname || "") ||
        values.lastname !== (userInfo?.lastname || "") ||
        values.address !== (userInfo?.address || "")
    );
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleAccountCancel = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setValues((current) => ({
      ...current,
      ...buildAccountSettingsValues(userInfo),
    }));
    setPic(null);
    setUpdatedDetails(false);
    setAvatarPreview(userInfo?.profilePicture || "/avatars/userprofile.png");
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleSecurityCancel = () => {
    setValues((current) => ({
      ...current,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  const handleAccountUpdate = async () => {
    if (!userInfo?.id) return;

    try {
      setIsSavingAccount(true);
      const { user, message } = await updateAccountDetails({
        userId: userInfo.id,
        avatarFile: pic,
        email: normalizeEmail(values.email),
        username: normalizeText(values.username),
        bio: values.bio.trim(),
        firstname: normalizeText(values.firstname),
        lastname: normalizeText(values.lastname),
        address: values.address.trim(),
      });

      setUserInfo(user);
      toast.success(message);
      setUpdatedDetails(false);
      setPic(null);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
      syncSavedState();
    } catch (error) {
      toast.error(
        getAccountErrorMessage(
          error,
          "Unable to update your account right now."
        )
      );
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!passwordsMatch(values.newPassword, values.confirmPassword)) {
      toast.error(CONFIRM_PASSWORD_ERROR_MESSAGE);
      return;
    }
    if (!new RegExp(PASSWORD_PATTERN).test(values.newPassword)) {
      toast.error(PASSWORD_ERROR_MESSAGE);
      return;
    }

    try {
      setIsSavingPassword(true);
      const { message } = await changeAccountPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword.trim(),
        confirmPassword: values.confirmPassword,
      });

      toast.success(message);
      handleSecurityCancel();
      syncSavedState();
    } catch (error) {
      toast.error(
        getAccountErrorMessage(
          error,
          "Unable to update your password right now."
        )
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return {
    activeTab,
    avatarInitials,
    avatarInputRef,
    avatarPreview,
    darkPreview,
    displayName,
    handleAccountCancel,
    handleAccountInputChange,
    handleAccountUpdate,
    handleAvatarChange,
    handleNavTab,
    handlePasswordUpdate,
    handleRemoveAvatar,
    handleSecurityCancel,
    handleSignOut,
    isSavingAccount,
    isSavingPassword,
    isSecurityFocused,
    isSecurityFormValid,
    prefs,
    saved,
    securitySectionRef,
    setDarkPreview,
    syncSavedState,
    updatePrefs,
    updatedDetails,
    values,
  };
}
