// lib/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { getUserByEmail } from "./db"

declare module "next-auth" {
  interface User {
    country?: string;
    phone?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      country?: string;
      phone?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    country?: string;
    phone?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await getUserByEmail(email)
        if (!user || !user.password) {
          return null
        }

        // Dynamically import/require bcryptjs to keep middleware bundling Edge-safe
        const bcrypt = require("bcryptjs")
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          country: user.country,
          phone: user.phone,
        }
      }
    })
  ],
  pages: {
    signIn: "/login", // Redirect unauthenticated users here
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.country = user.country
        token.phone = user.phone
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.country = token.country as string
        session.user.phone = token.phone as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
})