import {
  ActionResponse,
  ErrorResponse,
  PaginatedSearchParams,
  Question,
  Tag as ITag,
} from "@/types/global"

import action from "@/lib/handlers/action"
import {
  GetTagQuestionsSchema,
  PaginatedSearchParamsSchema,
} from "@/lib/validations"
import handleError from "@/lib/handlers/error"
import { FilterQuery } from "mongoose"
import { Tag } from "@/database"
import { GetTagQuestionsParams } from "@/types/action"
import { NotFoundError } from "@/lib/http-errors"
import QuestionModel from "@/database/question.model"

export async function getTags(
  params: PaginatedSearchParams,
): Promise<ActionResponse<{ tags: ITag[]; isNext: boolean }>> {
  const validationResult = action({
    params,
    schema: PaginatedSearchParamsSchema,
  })

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse
  }

  const { page = 1, pageSize = 10, query, filter } = params
  const skip = (Number(page) - 1) * Number(pageSize)
  const limit = Number(pageSize)

  const filterQuery: FilterQuery<typeof Tag> = {}

  if (query) {
    filterQuery.$or = [{ name: { $regex: query, $options: "i" } }]
  }

  let sortCriteria = {}

  switch (filter) {
    case "popular":
      sortCriteria = { questions: -1 }
      break
    case "recent":
      sortCriteria = { createdAt: -1 }
      break
    case "oldest":
      sortCriteria = { createdAt: 1 }
      break
    case "name":
      sortCriteria = { name: 1 }
      break
    default:
      sortCriteria = { questions: -1 }
      break
  }

  try {
    const totalQuestions = await Tag.countDocuments(filterQuery)
    const tags = await Tag.find(filterQuery)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)

    const isNext = totalQuestions > skip + tags.length

    return {
      success: true,
      data: { tags: JSON.parse(JSON.stringify(tags)), isNext },
    }
  } catch (error) {
    return handleError(error) as ErrorResponse
  }
}

export async function getTagQuestions(
  params: GetTagQuestionsParams,
): Promise<
  ActionResponse<{ tag: ITag; questions: Question[]; isNext: boolean }>
> {
  const validationResult = action({
    params,
    schema: GetTagQuestionsSchema,
  })

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse
  }

  const { tagId, page = 1, pageSize = 10, query } = params
  const skip = (Number(page) - 1) * Number(pageSize)
  const limit = Number(pageSize)

  try {
    const tag = await Tag.findById(tagId)
    if (!tag) throw new NotFoundError("Tag")

    const filterQuery: FilterQuery<typeof QuestionModel> = {
      tags: { $in: [tagId] },
    }

    if (query) {
      filterQuery.title = { $regex: query, $options: "i" }
    }

    const totalQuestions = await QuestionModel.countDocuments(filterQuery)

    const questions = await QuestionModel.find(filterQuery)
      .select("_id title views answers upvotes downvotes author createdAt")
      .populate([
        { path: "author", select: "name image" },
        { path: "tags", select: "name" },
      ])
      .skip(skip)
      .limit(limit)

    const isNext = totalQuestions > skip + questions.length

    return {
      success: true,
      data: {
        tag: JSON.parse(JSON.stringify(tag)),
        questions: JSON.parse(JSON.stringify(questions)),
        isNext,
      },
    }
  } catch (error) {
    return handleError(error) as ErrorResponse
  }
}
