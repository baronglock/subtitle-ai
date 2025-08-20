import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";

// Simple in-memory store for demo - replace with database in production
const users: any[] = [];

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

        // Find user in our simple store
        const user = users.find(u => u.email === credentials.email);
        
        if (!user) {
          // For demo, create user on first login
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          const newUser = {
            id: String(users.length + 1),
            email: credentials.email,
            name: credentials.email.split("@")[0],
            password: hashedPassword,
            plan: "free",
            minutesUsed: 0,
            minutesLimit: 30
          };
          users.push(newUser);
          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            plan: newUser.plan
          };
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as any).plan || "free";
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