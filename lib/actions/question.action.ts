"use server"

import { ActionResponse, ErrorResponse } from "@/types/global"
import action from "@/lib/handlers/action"
import { AskQuestionSchema } from "@/lib/validations"
import handleError from "@/lib/handlers/error"
import mongoose from "mongoose"
import Question, { IQuestionDoc } from "@/database/question.model"
import Tag from "@/database/tag.model"
import TagQuestion from "@/database/tag-question.model"

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
        { $setOnInsert: { name: tag }, $inc: { question: 1 } },
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
