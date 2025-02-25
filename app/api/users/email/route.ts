import handleError from "@/lib/handlers/error"
import { APIErrorResponse } from "@/types/global"
import { NotFoundError, ValidationError } from "@/lib/http-errors"
import { UserSchema } from "@/lib/validations"
import User from "@/database/user.model"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email) throw new NotFoundError("Email")

  try {
    const validatedData = UserSchema.partial().safeParse({ email })
    if (!validatedData.success)
      throw new ValidationError(validatedData.error.flatten().fieldErrors)

    const user = await User.findOne({ email })
    if (!user) throw new NotFoundError("Email")

    return NextResponse.json({ success: true, data: user }, { status: 200 })
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse
  }
}
