import axios from "axios";
import {
  CHANGE_PASSWORD_ROUTE,
  UPDATE_USER,
} from "@/utils/ApiRoutes";
import { mapApiUserToAppUser, type AppUserInfo } from "@/lib/auth/userInfo";
import { getClientErrorMessage } from "@/lib/api/clientErrors";

type AccountMutationResponse = {
  ok?: boolean;
  msg?: string;
  error?: string;
};

type UpdateUserResponse = AccountMutationResponse & {
  user?: {
    id: number | string;
    role?: string;
    email?: string;
    name?: string;
    username?: string;
    firstname?: string;
    lastname?: string;
    identifier?: string;
    profilePicture?: string;
    about?: string;
    userProfile?: {
      bio?: string;
      address?: string;
    };
  };
};

type UpdateAccountInput = {
  userId: number;
  email: string;
  username: string;
  bio: string;
  firstname: string;
  lastname: string;
  address: string;
  avatarFile?: File | null;
};

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function updateAccountDetails(input: UpdateAccountInput): Promise<{
  user: AppUserInfo;
  message: string;
}> {
  const formData = new FormData();

  if (input.avatarFile) {
    formData.append("avatar", input.avatarFile);
  }

  formData.append("email", input.email);
  formData.append("username", input.username);
  formData.append("bio", input.bio);
  formData.append("firstname", input.firstname);
  formData.append("lastname", input.lastname);
  formData.append("address", input.address);

  const response = await axios.post<UpdateUserResponse>(UPDATE_USER, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    params: { userId: input.userId },
    validateStatus: () => true,
  });

  const { data, status } = response;

  if (status === 200 && data?.ok && data.user) {
    return {
      user: mapApiUserToAppUser(data.user),
      message: data.msg || "Account updated successfully.",
    };
  }

  throw new Error(
    data?.error || data?.msg || "Unable to update your account right now."
  );
}

export async function changeAccountPassword(
  input: ChangePasswordInput
): Promise<{ message: string }> {
  const response = await axios.post<AccountMutationResponse>(
    CHANGE_PASSWORD_ROUTE,
    input,
    { validateStatus: () => true }
  );

  const { data, status } = response;

  if (status === 200 && data?.ok) {
    return { message: data.msg || "Password updated successfully." };
  }

  throw new Error(
    data?.error || data?.msg || "Unable to update your password right now."
  );
}

export { getClientErrorMessage as getAccountErrorMessage };
