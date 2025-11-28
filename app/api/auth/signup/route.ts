import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const signupSchema = z.object({
  name: z.string().min(1, "Navn er påkrævet"),
  email: z.string().email("Ugyldig email"),
  password: z.string().min(6, "Password skal være mindst 6 tegn"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email: rawEmail, password } = signupSchema.parse(body)
    
    // Normaliser email (trim og lowercase)
    const email = rawEmail.trim().toLowerCase()

    // Tjek om brugeren allerede findes
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email er allerede i brug" },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Opret bruger
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json(
      { message: "Bruger oprettet", user },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Signup error:", error)
    // Return mere detaljeret fejl i development
    const errorMessage = process.env.NODE_ENV === "development" 
      ? error?.message || "Der opstod en fejl"
      : "Der opstod en fejl"
    
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === "development" ? error : undefined },
      { status: 500 }
    )
  }
}

