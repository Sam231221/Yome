import axios from "axios";
import { GET_USER_ROUTE } from "@/utils/ApiRoutes";
import { getClientErrorMessage } from "@/lib/api/clientErrors";
import { logBrowserWarning } from "@/lib/debug/browserLogger";

type SessionUser = {
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

type ApiUser = {
  id: number;
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

export type AppUserInfo = {
  id: number;
  role?: string;
  email?: string;
  name?: string;
  username?: string;
  firstname?: string;
  lastname?: string;
  userProfile?: { bio?: string; address?: string };
  identifier?: string;
  profilePicture?: string;
  status?: string;
  bio?: string;
  address?: string;
};

/** Callback invoked by ensureUserInfo once the user record is resolved. */
export type SetUserInfoFn = (user: AppUserInfo) => void;

const DEFAULT_USER_INFO_ERROR = "Failed to load user information.";

export const getUserInfoErrorMessage = (
  error: unknown,
  fallback = DEFAULT_USER_INFO_ERROR
) => getClientErrorMessage(error, fallback);

export const logUserInfoLoadError = (context: string, error: unknown) => {
  logBrowserWarning(
    `[user-info] ${context}: ${getUserInfoErrorMessage(error)}`
  );
};

export function mapApiUserToAppUser(user: ApiUser): AppUserInfo {
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    userProfile: user.userProfile,
    identifier: user.identifier,
    profilePicture: user.profilePicture,
    status: user.about,
    bio: user.userProfile?.bio,
    address: user.userProfile?.address,
  };
}

export async function ensureUserInfo(params: {
  sessionUser?: SessionUser | null;
  currentUserInfo?: AppUserInfo;
  setUserInfo: SetUserInfoFn;
}): Promise<AppUserInfo | null> {
  const { sessionUser, currentUserInfo, setUserInfo } = params;
  if (currentUserInfo) return currentUserInfo;
  if (!sessionUser?.email) return null;

  const response = await axios.post(
    GET_USER_ROUTE,
    { email: sessionUser.email },
    { validateStatus: () => true }
  );
  if (response.status === 404) {
    const syncResponse = await axios.post(
      "/api/auth/sync-user",
      {
        email: sessionUser.email,
        name: sessionUser.name,
        image: sessionUser.image,
      },
      { validateStatus: () => true }
    );
    if (syncResponse.status === 200 || syncResponse.status === 201) {
      const syncedUser = syncResponse.data?.user as ApiUser | undefined;
      if (syncResponse.data?.ok && syncedUser) {
        const mapped = mapApiUserToAppUser(syncedUser);
        setUserInfo(mapped);
        return mapped;
      }
    }
  }

  if (response.status !== 200 || !response.data?.ok || !response.data?.user) {
    return null;
  }

  const mapped = mapApiUserToAppUser(response.data.user as ApiUser);
  setUserInfo(mapped);
  return mapped;
}
