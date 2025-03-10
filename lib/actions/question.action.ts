"use server"

import {
  ActionResponse,
  ErrorResponse,
  PaginatedSearchParams,
  Question as IQuestion,
} from "@/types/global"
import action from "@/lib/handlers/action"
import {
  AskQuestionSchema,
  EditQuestionSchema,
  GetQuestionSchema,
  IncrementViewsSchema,
  PaginatedSearchParamsSchema,
} from "@/lib/validations"
import handleError from "@/lib/handlers/error"
import mongoose, { FilterQuery } from "mongoose"
import Question, { IQuestionDoc } from "@/database/question.model"
import Tag, { ITagDoc } from "@/database/tag.model"
import TagQuestion from "@/database/tag-question.model"
import { NotFoundError, ValidationError } from "@/lib/http-errors"
import {
  CreateQuestionParams,
  EditQuestionParams,
  GetQuestionParams,
  IncrementViewsParams,
} from "@/types/action"
import { revalidatePath } from "next/cache"
import ROUTES from "@/constants/routes"

export async function createQuestion(
  params: CreateQuestionParams,
): Promise<ActionResponse<IQuestionDoc>> {
  const validationResult = await action({
    params,
    schema: AskQuestionSchema,
    authorize: true,
  })

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse
  }

  const { title, content, tags } = validationResult.params!
  const userId = validationResult.session?.user?.id

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const [question] = await Question.create(
      [{ title, content, author: userId }],
      { session },
    )
    if (!question) {
      throw new Error("Failed to create Question")
    }

    const tagIds: mongoose.Types.ObjectId[] = []
    const tagQuestionDocuments = []

    for (const tag of tags) {
      const existingTag = await Tag.findOneAndUpdate(
        // Ищем name = регулярке
        // Опция $setOnInsert отработает если не нашли такой тег
        // $inc - отработает в обоих случаях. Если тег есть увеличит значение question на 1. Если тега нет, то создаст question и установит ему 1
        // upsert Если тег найдён → просто обновляет его. Если тег не найден → создаёт новый документ с указанными данными.
        // new: true - По умолчанию findOneAndUpdate возвращает старый документ (до изменений).
        // new: true заставляет его вернуть уже обновлённый документ.
        { name: { $regex: new RegExp(`^${tag}$`, "i") } },
        { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
        { upsert: true, new: true, session },
      )

      tagIds.push(existingTag._id)
      tagQuestionDocuments.push({
        tag: existingTag._id,
        question: question._id,
      })
    }

    await TagQuestion.insertMany(tagQuestionDocuments, { session })
    await Question.findByIdAndUpdate(
      question._id,
      { $push: { tags: { $each: tagIds } } },
      { session },
    )
    await session.commitTransaction()

    return { success: true, data: JSON.parse(JSON.stringify(question)) }
  } catch (error) {
    await session.abortTransaction()
    return handleError(error) as ErrorResponse
  } finally {
    await session.endSession()
  }
}

export async function editQuestion(
  params: EditQuestionParams,
): Promise<ActionResponse<IQuestionDoc>> {
  const validationResult = await action({
    params,
    schema: EditQuestionSchema,
    authorize: true,
  })

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse
  }

  const { title, content, tags, questionId } = validationResult.params!
  const userId = validationResult?.session?.user?.id

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const question = await Question.findById(questionId).populate("tags")

    if (!question) {
      throw new Error("Question not found")
    }

    if (question.author.toString() !== userId) {
      throw new Error("Unauthorized")
    }

    if (question.title !== title || question.content !== content) {
      question.title = title
      question.content = content
      await question.save({ session })
    }

    const tagsToAdd = tags.filter(
      (tag) =>
        !question.tags.some((t: ITagDoc) =>
          t.name.toLowerCase().includes(tag.toLowerCase()),
        ),
    )

    const tagsToRemove = question.tags.filter(
      (tag: ITagDoc) =>
        !tags.some((t) => t.toLowerCase() === tag.name.toLowerCase()),
    )

    const newTagDocuments = []

    if (tagsToAdd.length > 0) {
      for (const tag of tagsToAdd) {
        const existingTag = await Tag.findOneAndUpdate(
          { name: { $regex: `^${tag}$`, $options: "i" } },
          { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
          { upsert: true, new: true, session },
        )

        if (existingTag) {
          newTagDocuments.push({
            tag: existingTag._id,
            question: questionId,
          })

          question.tags.push(existingTag._id)
        }
      }
    }

    if (tagsToRemove.length > 0) {
      const tagIdsToRemove = tagsToRemove.map((tag: ITagDoc) => tag._id)

      await Tag.updateMany(
        { _id: { $in: tagIdsToRemove } },
        { $inc: { questions: -1 } },
        { session },
      )

      await TagQuestion.deleteMany(
        { tag: { $in: tagIdsToRemove }, question: questionId },
        { session },
      )

      question.tags = question.tags.filter(
        (tag: mongoose.Types.ObjectId) =>
          !tagIdsToRemove.some((id: mongoose.Types.ObjectId) =>
            id.equals(tag._id),
          ),
      )
    }

    if (newTagDocuments.length > 0) {
      await TagQuestion.insertMany(newTagDocuments, { session })
    }

    await question.save({ session })
    await session.commitTransaction()

    return { success: true, data: JSON.parse(JSON.stringify(question)) }
  } catch (error) {
    await session.abortTransaction()
    return handleError(error) as ErrorResponse
  } finally {
    await session.endSession()
  }
}

export async function getQuestion(
  params: GetQuestionParams,
): Promise<ActionResponse<IQuestion>> {
  const validationResult = await action({
    params,
    schema: GetQuestionSchema,
    authorize: true,
  })

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse
  }

  const { questionId } = validationResult.params!

  try {
    const question = await Question.findById(questionId)
      .populate("tags")
      .populate("author", "_id name image")
    if (!question) throw new NotFoundError("Question")

    return { success: true, data: JSON.parse(JSON.stringify(question)) }
  } catch (error) {
    return handleError(error) as ErrorResponse
  }
}

export async function getQuestions(
  params: PaginatedSearchParams,
): Promise<ActionResponse<{ questions: IQuestion[]; isNext: boolean }>> {
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

  // FilterQuery<T> - это тип от монгоДБ. Далее мы работаем с фильтрацией,
  // через методы монгоДБ - заполняем объект filterQuery, чтобы он соответствовал спецификации монгоДБ
  const filterQuery: FilterQuery<typeof Question> = {}

  if (filter === "recommended") {
    return { success: true, data: { questions: [], isNext: false } }
  }

  if (query) {
    filterQuery.$or = [
      { title: { $regex: new RegExp(query, "i") } },
      { content: { $regex: new RegExp(query, "i") } },
    ]
  }

  // sortCriteria будет передаваться с запросом к монгоДБ
  let sortCriteria = {}

  switch (filter) {
    case "newest":
      // Тут указываем, чтобы сортировалось все от нового к старому
      sortCriteria = { createdAt: -1 }
      break
    case "unanswered":
      // Указываем, чтобы искали вопросы без ответов filterQuery.answers = 0
      filterQuery.answers = 0
      sortCriteria = { createdAt: -1 }
      break
    case "popular":
      // Сортируем по количеству апвоутов, от большего к меньшему
      sortCriteria = { upvotes: -1 }
      break
    default:
      sortCriteria = { createdAt: -1 }
      break
  }

  try {
    // Сколько у нас всего документов подходящих по фильтрации
    const totalQuestions = await Question.countDocuments(filterQuery)
    // тут populate заполнит tags только name - ами
    // lean означает, что монгоДБ документ будет конвертирован в plain JS объект, чтобы было легче с ним работать
    const questions = await Question.find(filterQuery)
      .populate("tags", "name")
      .populate("author", "name image")
      .lean()
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)

    const isNext = totalQuestions > skip + questions.length

    //  JSON.parse(JSON.stringify(questions)) - так делаем потому что некст js иногда выбрасывает ошибку связанную с другим способом возврата данных
    return {
      success: true,
      data: { questions: JSON.parse(JSON.stringify(questions)), isNext },
    }
  } catch (error) {
    return handleError(error) as ErrorResponse
  }
}

export async function incrementViews(
  params: IncrementViewsParams,
): Promise<ActionResponse<{ views: number }>> {
  const validatedResult = await action({ params, schema: IncrementViewsSchema })

  if (validatedResult instanceof Error) {
    return handleError(validatedResult) as ErrorResponse
  }

  const { questionId } = validatedResult.params!

  try {
    const question = await Question.findById(questionId)
    if (!question) throw new NotFoundError("question")

    question.views += 1
    await question.save()

    return {
      success: true,
      data: { views: question.views },
    }
  } catch (error) {
    return handleError(error) as ErrorResponse
  }
}
