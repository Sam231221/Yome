import bcryptjs from "bcryptjs";
import axios from "axios";
import FacebookProvider from "next-auth/providers/facebook";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { GET_USER_ROUTE } from "@/utils/ApiRoutes";
export const options = {
  pages: {
    signIn: "/login",
  },
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
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
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    GoogleProvider({
      profile(profile) {
        return {
          ...profile,
          role: profile.role ?? "USER",
          id: profile.sub,
        };
      },
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_Secret,
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

        const { data } = await axios.post(GET_USER_ROUTE, {
          email: credentials.email,
        });
        if (data.user) {
          const match = await bcryptjs.compare(
            credentials.password,
            data.user.password
          );
          if (match) {
            return data.user;
          } else return null;
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
      return { ...token, ...user };
    },
    // If you want to use the role in client components
    async session({ session, token }) {
      // if (session?.user) session.user.role = token.role;
      // return session;
      session.user = token;
      //Dont store password in session.
      delete session.user.password;
      return session;
    },
  },
};
