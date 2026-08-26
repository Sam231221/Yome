import axios from "axios";
import type { AuthOptions } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { UPSERT_OAUTH_USER_ROUTE, VERIFY_CREDENTIALS_ROUTE } from "@/utils/ApiRoutes";

export const options: AuthOptions = {
  pages: {
    signIn: "/login",
  },
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
    }),
    GitHubProvider({
      profile(profile) {
        return {
          ...profile,
          role: profile.role ?? "user",
          id: profile.id.toString(),
          image: profile.avatar_url,
        };
      },
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    GoogleProvider({
      profile(profile) {
        return {
          ...profile,
          role: profile.role ?? "USER",
          id: profile.sub,
        };
      },
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_Secret ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email:",
          type: "text",
          placeholder: "Your Email",
        },
        password: {
          label: "Password:",
          type: "password",
          placeholder: "Your password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const response = await axios.post(
            VERIFY_CREDENTIALS_ROUTE,
            { email: credentials.email, password: credentials.password },
            { validateStatus: () => true },
          );
          if (response.status === 200 && response.data?.ok && response.data?.user) {
            return response.data.user;
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (!user?.email) return false;

      try {
        const response = await axios.post(
          UPSERT_OAUTH_USER_ROUTE,
          {
            email: user.email,
            name: user.name,
            image: user.image,
          },
          {
            headers: process.env.GATEWAY_SHARED_TOKEN
              ? { Authorization: `Bearer ${process.env.GATEWAY_SHARED_TOKEN}` }
              : undefined,
            validateStatus: () => true,
          }
        );
        if (!response.data?.ok || !response.data?.user?.id) return false;
        user.id = String(response.data.user.id);
        user.name = response.data.user.name ?? user.name;
        user.image = response.data.user.profilePicture ?? user.image;
        return true;
      } catch {
        return false;
      }
    },
    // Ref: https://authjs.dev/guides/basics/role-based-access-control
    //persisting-the-role
    async jwt({ token, user }) {
      // if (user) token.role = user.role;
      // return token;
      if (user) {
        // Ensure id is set from user data on first sign in
        return { ...token, ...user, id: user.id };
      }
      return token;
    },
    // If you want to use the role in client components
    async session({ session, token }) {
      // if (session?.user) session.user.role = token.role;
      // return session;
      session.user = token as typeof session.user & Record<string, unknown>;
      // Ensure id is always set
      if (session.user) {
        const u = session.user as Record<string, unknown>;
        if (token.id) {
          u.id = token.id;
        } else if (token.sub) {
          u.id = token.sub;
        }
        delete u.password;
      }

      return session;
    },
  },
};
