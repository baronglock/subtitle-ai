import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { getUserByEmail, findOrCreateOAuthUser } from "../../../lib/userStore";

const handler = NextAuth({
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
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-ins
      if (account?.provider === "google" || account?.provider === "github") {
        if (profile?.email) {
          const dbUser = await findOrCreateOAuthUser({
            email: profile.email,
            name: profile.name || profile.email.split('@')[0],
            provider: account.provider,
          });
          
          // Attach plan info to user object
          (user as any).plan = dbUser.plan;
          (user as any).id = dbUser.id;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as any).plan || "free";
      }
      
      // For OAuth, fetch user data from database
      if (account?.provider === "google" || account?.provider === "github") {
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
});

export { handler as GET, handler as POST };