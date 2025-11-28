import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials")
            return null
          }

          const email = credentials.email.trim().toLowerCase()
          console.log("Attempting login for:", email)
          console.log("Prisma client initialized:", !!prisma)

          const user = await prisma.user.findUnique({
            where: { email }
          })

          if (!user) {
            console.log("User not found for email:", email)
            // Prøv også med original email hvis lowercase ikke virker
            const userAlt = await prisma.user.findUnique({
              where: { email: credentials.email.trim() }
            })
            if (userAlt) {
              console.log("User found with original email format")
            } else {
              console.log("User not found with either email format")
            }
            return null
          }

          console.log("User found:", user.email, "Checking password...")

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          console.log("Password valid:", isPasswordValid)

          if (!isPasswordValid) {
            console.log("Invalid password for user:", user.email)
            return null
          }

          console.log("Login successful for:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("Error in authorize:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}

