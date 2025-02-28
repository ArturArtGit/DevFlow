import dbConnect from "@/lib/mongoose"
import mongoose from "mongoose"
import handleError from "@/lib/handlers/error"
import { APIErrorResponse } from "@/types/global"
import { SignInWithOAuthSchema } from "@/lib/validations"
import slugify from "slugify"
import { ValidationError } from "@/lib/http-errors"
import User from "@/database/user.model"
import Account from "@/database/account.model"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { provider, providerAccountId, user } = await request.json()
  await dbConnect()

  // startSession - Сессия нужна для работы с транзакциями, которые позволяют выполнять несколько операций с базой данных как единое целое
  // Если одна операция провалится, то отменятся все. Используем это здесь, так как это логика нашего приложения. Мы должны создать пользователя и его аккаунт
  // одновременно. Нельзя создать пользователя, а аккаунт не создавать.
  const session = await mongoose.startSession()
  // Запускаем цепочку транзакций с этого момента.
  session.startTransaction()

  try {
    const validatedData = SignInWithOAuthSchema.safeParse({
      provider,
      providerAccountId,
      user,
    })

    if (!validatedData.success)
      throw new ValidationError(validatedData.error.flatten().fieldErrors)

    const { name, username, email, image } = user
    const slugifiedUsername = slugify(username, {
      lower: true,
      strict: true,
      trim: true,
    })

    // Проверяем есть ли пользователь в БД. Указываем, что это транзакция (операция), является частью транзакций единой сессии.
    let existingUser = await User.findOne({ email }).session(session)

    if (!existingUser) {
      // Указываем, что это транзакция (операция), является частью транзакций единой сессии.
      // Метод create возвращает массив документов, даже если был создан только 1, но это потому что мы передаем объект нового пользователя в массиве.
      // Можно просто передать объект и не использовать деструктуризацию, НО это сработает только если мы не используем атомарные транзакции как тут.
      // В нашем случае, нам всегда надо передавать в массиве новых пользователей, так как нам надо передать второй параметр - объект сессии.
      // А в этом примере можем использовать
      // либо деструктуризацию [existingUser], либо обратиться к первому элементу массива в конце [0], но обернуть в скобки await
      // eslint-disable-next-line
      ;[existingUser] = await User.create(
        [{ name, username: slugifiedUsername, email, image }],
        { session },
      )
    } else {
      // Проверяем, надо ли обновлять данные пользователя. Отличаются ли они.
      /* Todo проверить будет ли каждый раз перезаписываться name и image, поочереди аутентифицируясь через гитхаб и гугл.
        При этом имя и фото в аккаунтах должны быть разными, а почта одинаковой.
      */
      const updatedData: { name?: string; image?: string } = {}

      if (existingUser.name !== name) updatedData.name = name
      if (existingUser.image !== image) updatedData.image = image

      if (Object.keys(updatedData).length > 0) {
        await User.updateOne(
          { _id: existingUser._id },
          { $set: updatedData },
        ).session(session)
      }
    }

    const existingAccount = await Account.findOne({
      userId: existingUser._id,
      provider,
      providerAccountId,
    }).session(session)

    if (!existingAccount) {
      await Account.create(
        [
          {
            userId: existingUser._id,
            name,
            image,
            provider,
            providerAccountId,
          },
        ],
        { session },
      )
    }

    // Подтверждаем все транзакции, тут они применятся либо все, либо ни одной
    await session.commitTransaction()

    return NextResponse.json({ success: true })
  } catch (error) {
    await session.abortTransaction()
    return handleError(error, "api") as APIErrorResponse
  } finally {
    await session.endSession()
  }
}
