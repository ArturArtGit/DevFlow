import { NextResponse } from "next/server"
import { RequestError, ValidationError } from "@/lib/http-errors"
import { ZodError } from "zod"
import logger from "@/lib/logger"

// API - для ошибок api, а server для ошибок Server Actions
export type ResponseType = "api" | "server"

const formatResponse = (
  responseType: ResponseType,
  status: number,
  message: string,
  errors?: Record<string, string[]> | undefined,
) => {
  const responseContent = {
    success: false,
    error: {
      message,
      details: errors,
    },
  }

  // API - для ошибок api, а server для ошибок Server Actions. Если ошибку пришла с API, то возвращаем то, что после "?", а если SA - то ":".
  return responseType === "api"
    ? NextResponse.json(responseContent, { status })
    : { status, ...responseContent }
}

const handleError = (error: unknown, responseType: ResponseType = "server") => {
  if (error instanceof RequestError) {
    logger.error(
      { err: error },
      `${responseType.toUpperCase()} Error: ${error.message}`,
    )

    return formatResponse(
      responseType,
      error.statusCode,
      error.message,
      error.errors,
    )
  }

  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      error.flatten().fieldErrors as Record<string, string[]>,
    )

    logger.error({ err: error }, `Validation Error: ${error.message}`)

    return formatResponse(
      responseType,
      validationError.statusCode,
      validationError.message,
      validationError.errors,
    )
  }

  if (error instanceof Error) {
    logger.error(error.message)
    return formatResponse(responseType, 500, error.message)
  }

  logger.error({ err: error }, "An unexpected error occurred")
  return formatResponse(responseType, 500, "An unexpected error occurred")
}

export default handleError
