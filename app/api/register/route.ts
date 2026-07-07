// app/api/register/route.ts
import { NextResponse } from "next/server"
import { createUser, getUserByEmail } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, country, phone } = body

    // Validation
    if (!name || !email || !password || !country || !phone) {
      return NextResponse.json(
        { error: "Missing required fields (name, email, password, country, phone)" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email formatting" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash the password with bcryptjs
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Save the user
    const newUser = await createUser({
      name,
      email,
      password: hashedPassword,
      country,
      phone,
    })

    if (!newUser) {
      return NextResponse.json(
        { error: "Failed to persist user" },
        { status: 500 }
      )
    }

    // Return the response without the hashed password
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json(
      { message: "Registration successful", user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
