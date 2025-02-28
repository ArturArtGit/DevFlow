import NextAuth from "next-auth"
import Github from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { api } from "@/lib/api"
import { ActionResponse } from "@/types/global"
import Credentials from "next-auth/providers/credentials"
import { SignInSchema } from "@/lib/validations"
import { IAccountDoc } from "@/database/account.model"
import { IUserDoc } from "@/database/user.model"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Github,
    Google,
    Credentials({
      // Этот код отработает когда мы выполняем вход, именно вход - signIn, через логин и пароль.
      async authorize(credentials) {
        const validatedFields = SignInSchema.safeParse(credentials)

        if (validatedFields.success) {
          const { email, password } = validatedFields.data

          const { data: existingAccount } = (await api.accounts.getByProvider(
            email,
          )) as ActionResponse<IAccountDoc>

          if (!existingAccount) return null

          const { data: existingUser } = (await api.users.getById(
            existingAccount.userId.toString(),
          )) as ActionResponse<IUserDoc>

          if (!existingUser) return null

          const isValidPassword = await bcrypt.compare(
            password,
            existingAccount.password!,
          )

          if (isValidPassword) {
            return {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              image: existingUser.image,
            }
          }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Записываем в объект сессии userId пользователя. Достаем его из jwt токена.
      session.user.id = token.sub as string
      return session
    },
    /*
    Параметр user передаётся только при первом входе пользователя.
    При следующих обновлениях токена NextAuth берёт данные только из token, поэтому важно сохранить нужные поля в токене при первом входе.
    */
    async jwt({ token, account }) {
      // Next auth создает токен автоматически. При создании токена, мы в этой функции записываем в него userId.
      if (account) {
        const { data: existingAccount, success } =
          await api.accounts.getByProvider(
            account.type === "credentials"
              ? token.email!
              : account.providerAccountId,
          )

        if (!success || !existingAccount) return token

        const userId = existingAccount.userId

        if (userId) token.sub = userId.toString()
      }

      return token
    },
    // При аут-ции через гитхаб или гугл, нам надо вызвать свою функцию по созданию user-a и его аккаунта
    // {user, profile, account} - это возвращает нам провайдер, насчет account не уверен.
    // если тип === 'credentials', что значит осуществляем вход по логину и паролю
    // возвращаем true - значит разрешаем аутентифицироваться, false - запрещаем
    async signIn({ user, profile, account }) {
      // Если мы входим через логин и пароль (это credentials), то пропускаем колбек, такой вход обработаем по другому.
      if (account?.type === "credentials") return true
      if (!account || !user) return false

      const userInfo = {
        name: user.name!,
        email: user.email!,
        image: user.image!,
        username:
          account.provider === "github"
            ? (profile?.login as string)
            : (user.name?.toLowerCase() as string),
      }

      const { success } = (await api.auth.oAuthSignIn({
        user: userInfo,
        provider: account.provider as "github" | "google",
        providerAccountId: account.providerAccountId,
      })) as ActionResponse

      if (!success) return false

      return true
    },
  },
})
