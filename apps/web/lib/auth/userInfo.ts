import axios from "axios";
import { reducerCases } from "@/context/constants";
import { GET_USER_ROUTE } from "@/utils/ApiRoutes";

type SessionUser = {
  email?: string | null;
};

type ApiUser = {
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

export type AppUserInfo = {
  id: number | string;
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

type DispatchFn = (action: { type: string; userInfo: AppUserInfo }) => void;

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
  dispatch: DispatchFn;
}): Promise<AppUserInfo | null> {
  const { sessionUser, currentUserInfo, dispatch } = params;
  if (currentUserInfo) return currentUserInfo;
  if (!sessionUser?.email) return null;

  const response = await axios.post(
    GET_USER_ROUTE,
    { email: sessionUser.email },
    { validateStatus: () => true }
  );
  if (response.status !== 200 || !response.data?.ok || !response.data?.user) {
    return null;
  }

  const mapped = mapApiUserToAppUser(response.data.user as ApiUser);
  dispatch({
    type: reducerCases.SET_USER_INFO,
    userInfo: mapped,
  });
  return mapped;
}
