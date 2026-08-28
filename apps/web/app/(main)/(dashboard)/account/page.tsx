"use client";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { reducerCases } from "@/context/constants";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { IoSettingsOutline } from "react-icons/io5";
import { IoKeyOutline } from "react-icons/io5";
import { useStateProvider } from "@/context/StateContext";
import FormInput from "@/components/FormInput/Form";
import { accountInputs, securityInputs } from "./inputs";
import toast from "react-hot-toast";
import ProfileAvatar from "@/components/common/ProfileAvatar/ProfileAvatar";
import {
  ensureUserInfo,
  logUserInfoLoadError,
} from "@/lib/auth/userInfo";
import {
  changeAccountPassword,
  getAccountErrorMessage,
  updateAccountDetails,
} from "@/lib/account/accountApi";
import {
  CONFIRM_PASSWORD_ERROR_MESSAGE,
  normalizeEmail,
  normalizeText,
  PASSWORD_ERROR_MESSAGE,
  PASSWORD_PATTERN,
  passwordsMatch,
} from "@/lib/auth/formValidation";
import { Badge, PageHeading } from "@/components/yome/YomeUI";

interface Values {
  email: string;
  username: string;
  bio: string;
  firstname: string;
  lastname: string;
  address: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  [key: string]: string | undefined;
}

const Account = () => {
  const [{ userInfo }, dispatch] = useStateProvider();

  const [updatedDetails, setUpdatedDetails] = useState(false);
  const [isSecurityFormValid, setIsSecurityFormValid] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const [pic, setPic] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [values, setValues] = useState<Values>({
    email: "",
    username: "",
    bio: "",
    firstname: "",
    lastname: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "security" || requestedTab === "general") {
      setActiveTab(requestedTab);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!session?.user || userInfo) return;
        await ensureUserInfo({
          sessionUser: session.user,
          currentUserInfo: userInfo,
          dispatch,
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
  }, [session?.user, userInfo, dispatch]);

  useEffect(() => {
    setValues((prev) => ({
      ...prev,
      email: userInfo?.email || "",
      username: userInfo?.username || "",
      bio: userInfo?.bio || "",
      firstname: userInfo?.firstname || "",
      lastname: userInfo?.lastname || "",
      address: userInfo?.address || "",
    }));
  }, [userInfo]);

  const onChangeFormInputs = (e: ChangeEvent<HTMLInputElement>) => {
    const nextValues = { ...values, [e.target.name]: e.target.value };
    setValues(nextValues);
    setUpdatedDetails(
      nextValues.bio !== (userInfo?.bio || "") ||
        nextValues.address !== (userInfo?.address || "") ||
        nextValues.firstname !== (userInfo?.firstname || "") ||
        nextValues.lastname !== (userInfo?.lastname || "") ||
        nextValues.email !== (userInfo?.email || "") ||
        nextValues.username !== (userInfo?.username || "") ||
        Boolean(pic)
    );
  };

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
  }, [values.currentPassword, values.newPassword, values.confirmPassword]);

  const handleTab = (type: string) => {
    setActiveTab(type);
    router.replace(`/account?tab=${type}`);
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
      dispatch({
        type: reducerCases.SET_USER_INFO,
        userInfo: user,
      });
      toast.success(message);
      setUpdatedDetails(false);
      setPic(null);
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

  const handlePasswordUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      setValues((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
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

  return (
    <div className="yome-page">
      <PageHeading
        eyebrow="Account"
        title="Profile and security"
        subtitle="Keep your learning identity, avatar, and password up to date."
        action={<Badge tone="blue">{activeTab === "general" ? "General" : "Security"}</Badge>}
      />
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <aside className="yome-card yome-section yome-list">
          <button
            onClick={() => handleTab("general")}
            className={activeTab === "general" ? "yome-nav-item active" : "yome-nav-item"}
          >
            <IoSettingsOutline className="text-xl" />
            <span>General</span>
          </button>
          <button
            onClick={() => handleTab("security")}
            className={activeTab === "security" ? "yome-nav-item active" : "yome-nav-item"}
          >
            <IoKeyOutline className="text-xl" />
            <span>Security</span>
          </button>
        </aside>

        <section className="yome-card yome-section">
          {activeTab === "general" && (
            <div className="mx-auto max-w-3xl">
              <div className="mb-6">
                <ProfileAvatar
                  pic={`${userInfo?.profilePicture || "/avatars/userprofile.png"}`}
                  setPic={setPic}
                />
              </div>
              <form method="POST" className="grid gap-4">
                <div className="grid grid-cols-1 gap-3">
                  {accountInputs.slice(0, 3).map((input) => (
                    <FormInput
                      label={input.label ?? input.name}
                      readOnly={false}
                      key={input.id}
                      {...input}
                      value={values[input.name]}
                      onChange={onChangeFormInputs}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {accountInputs.slice(3).map((input) => (
                    <FormInput
                      readOnly={false}
                      label={input.label ?? input.name}
                      key={input.id}
                      {...input}
                      value={values[input.name]}
                      onChange={onChangeFormInputs}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleAccountUpdate()}
                  disabled={!updatedDetails || isSavingAccount}
                  className="yome-button-primary w-max"
                >
                  {isSavingAccount ? "Saving..." : "Save changes"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <form onSubmit={handlePasswordUpdate} method="POST" className="mx-auto grid max-w-2xl gap-4">
              <div className="grid grid-cols-1 gap-3">
                {securityInputs.map((input) => (
                  <FormInput
                    label={input.label ?? input.name}
                    key={input.id}
                    {...input}
                    value={values[input.name]}
                    onChange={onChangeFormInputs}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={!isSecurityFormValid || isSavingPassword}
                className="yome-button-primary w-max"
              >
                {isSavingPassword ? "Updating password..." : "Update password"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};
export default Account;
