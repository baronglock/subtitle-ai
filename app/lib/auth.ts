import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { getUserByEmail, findOrCreateOAuthUser } from "./userStore";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user in our store
        const user = await getUserByEmail(credentials.email);
        
        if (!user) {
          // User doesn't exist - they need to sign up first
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth sign-ins, create or find user
      if (account?.provider && account.provider !== "credentials") {
        const oauthUser = await findOrCreateOAuthUser({
          email: user.email!,
          name: user.name || "",
          provider: account.provider
        });
        
        // Update user object with our database info
        user.id = oauthUser.id;
        (user as any).plan = oauthUser.plan;
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as any).plan;
      } else {
        // On subsequent requests, refresh user data from database
        if (token.email) {
          const dbUser = await getUserByEmail(token.email as string);
          if (dbUser) {
            token.id = dbUser.id;
            token.plan = dbUser.plan;
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id;
        (session.user as any).plan = token.plan;
      }
      return session;
    }
  }
};