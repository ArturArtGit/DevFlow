"use server"

import { CollectionBaseParams } from "@/types/action"
import {
  ActionResponse,
  ErrorResponse,
  PaginatedSearchParams,
} from "@/types/global"
import action from "@/lib/handlers/action"
import {
  CollectionBaseSchema,
  PaginatedSearchParamsSchema,
} from "@/lib/validations"
import { NotFoundError } from "@/lib/http-errors"
import handleError from "@/lib/handlers/error"
import { Collection, Question } from "@/database"
import { revalidatePath } from "next/cache"
import ROUTES from "@/constants/routes"
import { ICollectionDoc } from "@/database/collection.model"
import { FilterQuery } from "mongoose"

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
      await Collection.findByIdAndDelete(collection._id)
      revalidatePath(ROUTES.QUESTION(questionId))

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

export async function hasSavedQuestion(
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
    const collection = await Collection.findOne({
      question: questionId,
      author: userId,
    })

    return {
      success: true,
      data: { saved: !!collection },
    }
  } catch (error) {
    return handleError(error) as ErrorResponse
  }
}

export async function getSavedQuestions(
  params: PaginatedSearchParams,
): Promise<ActionResponse<{ collections: ICollectionDoc[]; isNext: boolean }>> {
  const validationResult = await action({
    params,
    schema: PaginatedSearchParamsSchema,
    authorize: true,
  })

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse
  }

  const userId = validationResult.session?.user?.id
  const { page = 1, pageSize = 10, query, filter } = params

  const skip = (Number(page) - 1) * Number(pageSize)
  const limit = Number(pageSize)

  const filterQuery: FilterQuery<typeof Collection> = {}

  if (query) {
    filterQuery.$or = [
      { title: { $regex: new RegExp(query, "i") } },
      { content: { $regex: new RegExp(query, "i") } },
    ]
  }

  let sortCriteria = {}

  switch (filter) {
    case "mostrecent":
      sortCriteria = { createdAt: -1 }
      break
    case "oldest":
      filterQuery.answers = 0
      sortCriteria = { createdAt: -1 }
      break
    case "mostvoted":
      sortCriteria = { upvotes: -1 }
      break
    case "mostanswered":
      sortCriteria = { answers: -1 }
      break
    default:
      sortCriteria = { createdAt: -1 }
      break
  }

  try {
    const totalQuestions = await Question.countDocuments(filterQuery)
    const questions = await Collection.find(filterQuery)
      .populate({
        path: "question",
        populate: [
          { path: "tags", select: "_id name" },
          { path: "author", select: "_id name image" },
        ],
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)

    const isNext = totalQuestions > skip + questions.length

    return {
      success: true,
      data: { collections: JSON.parse(JSON.stringify(questions)), isNext },
    }
  } catch (error) {
    return handleError(error) as ErrorResponse
  }
}
