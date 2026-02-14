import bcryptjs from "bcryptjs";
import axios from "axios";
import type { AuthOptions } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { GET_USER_ROUTE } from "@/utils/ApiRoutes";

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
        // This is where you need to retrieve user data
        // to verify with credentials
        // Docs: https://next-auth.js.org/configuration/providers/credentials
        if (!credentials?.email || !credentials?.password) return null;

        let data;
        try {
          const response = await axios.post(GET_USER_ROUTE, {
            email: credentials.email,
          });
          data = response.data;
        } catch (error) {
          return null;
        }

        if (data.user) {
          const match = await bcryptjs.compare(
            credentials.password,
            data.user.password,
          );

          if (match) {
            return data.user;
          } else {
            return null;
          }
        }
        if (!data.user) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
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
      session.user = token as any;
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
