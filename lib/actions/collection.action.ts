"use server"

import { CollectionBaseParams } from "@/types/action"
import { ActionResponse, ErrorResponse } from "@/types/global"
import action from "@/lib/handlers/action"
import { CollectionBaseSchema } from "@/lib/validations"
import { NotFoundError, ValidationError } from "@/lib/http-errors"
import handleError from "@/lib/handlers/error"
import { Collection, Question } from "@/database"
import { revalidatePath } from "next/cache"
import ROUTES from "@/constants/routes"

export async function toggleSaveQuestion(
  params: CollectionBaseParams,
): Promise<ActionResponse<{ saved: boolean }>> {
  const validationResult = await action({
    params,
    schema: CollectionBaseSchema,
    authorize: true,
  })

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse
  }

  const { questionId } = validationResult.params!
  const userId = validationResult.session?.user?.id

  try {
    const question = await Question.findById(questionId)
    if (!question) throw new NotFoundError("Question")

    const collection = await Collection.findOne({
      question: questionId,
      author: userId,
    })

    if (collection) {
      await Collection.findByIdAndDelete(collection.id)
      return {
        success: true,
        data: { saved: false },
      }
    }

    await Collection.create({ question: questionId, author: userId })

    revalidatePath(ROUTES.QUESTION(questionId))

    return {
      success: true,
      data: { saved: true },
    }
  } catch (error) {
    return handleError(error) as ErrorResponse
  }
}
