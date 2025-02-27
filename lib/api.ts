import { fetchHandler } from "@/lib/handlers/fetch"
import { IUser } from "@/database/user.model"
import { IAccount, IAccountDoc } from "@/database/account.model"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api"

const API_USERS_BASE_URL = `${API_BASE_URL}/users`
const API_ACCOUNTS_BASE_URL = `${API_BASE_URL}/accounts`

export const api = {
  auth: {
    oAuthSignIn: ({
      user,
      provider,
      providerAccountId,
    }: SignInWithOAuthParams) =>
      fetchHandler(`${API_BASE_URL}/auth/signin-with-oauth`, {
        method: "POST",
        body: JSON.stringify({ user, provider, providerAccountId }),
      }),
  },
  users: {
    getAll: () => fetchHandler(API_USERS_BASE_URL),
    getById: (id: string) => fetchHandler(`${API_USERS_BASE_URL}/${id}`),
    getByEmail: (email: string) =>
      fetchHandler(`${API_USERS_BASE_URL}/email`, {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    create: (userData: Partial<IUser>) =>
      fetchHandler(API_USERS_BASE_URL, {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    update: (id: string, userData: Partial<IUser>) =>
      fetchHandler(`${API_USERS_BASE_URL}/${id}`, {
        method: "PUT",
        body: JSON.stringify(userData),
      }),
    delete: (id: string) =>
      fetchHandler(`${API_USERS_BASE_URL}/${id}`, {
        method: "DELETE",
      }),
  },
  accounts: {
    getAll: () => fetchHandler(API_ACCOUNTS_BASE_URL),
    getById: (id: string) => fetchHandler(`${API_ACCOUNTS_BASE_URL}/${id}`),
    getByProvider: (providerAccountId: string) =>
      fetchHandler<IAccountDoc>(`${API_ACCOUNTS_BASE_URL}/email`, {
        method: "POST",
        body: JSON.stringify({ providerAccountId }),
      }),
    create: (accountData: Partial<IAccount>) =>
      fetchHandler(API_ACCOUNTS_BASE_URL, {
        method: "POST",
        body: JSON.stringify(accountData),
      }),
    update: (id: string, accountData: Partial<IAccount>) =>
      fetchHandler(`${API_ACCOUNTS_BASE_URL}/${id}`, {
        method: "PUT",
        body: JSON.stringify(accountData),
      }),
    delete: (id: string) =>
      fetchHandler(`${API_ACCOUNTS_BASE_URL}/${id}`, {
        method: "DELETE",
      }),
  },
}
