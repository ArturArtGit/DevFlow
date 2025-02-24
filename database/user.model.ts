import { model, models, Schema } from "mongoose"

// Описываем интерфейс для типизации
export interface IUser {
  name: string
  username: string
  email: string
  bio?: string
  image: string
  location?: string
  portfolio?: string
  reputation?: number
}

// Опишем схему User-a. timestamps - указываем, чтобы в бд была запись даты создания пользователя
// указываем интерфейс, чтобы подхватывались типы
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    bio: { type: String },
    image: { type: String, required: true },
    location: { type: String },
    portfolio: { type: String },
    reputation: { type: Number, default: 0 },
  },
  { timestamps: true },
)

// Создаем модель для монго, если в моделях уже есть такая модель, то берем ее, иначе создаем новую
// и указываем ей имя и схему по которой надо ее делать и указываем TS схемы <IUser>,
// чтобы на фронтенд части приложения у нас подхватывались типы
// ** В models хранятся все созданные модели

const User = models?.User || model<IUser>("User", UserSchema)

export default User
