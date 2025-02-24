import { model, models, Schema, Document } from "mongoose"

// Описываем интерфейс для типизации
export interface IUser {
  name: string
  username: string
  email: string
  bio?: string
  image?: string
  location?: string
  portfolio?: string
  reputation?: number
}

// Экспортируем этот интерфейс, чтобы TS подхватывал такие поля как _id, id, createdAt и т.д., которые mongoose добавляет сам
// Делать именно так это рекомендация от разработчиков mongoose.
export interface IUserDoc extends IUser, Document {}

// Опишем схему User-a. timestamps - указываем, чтобы в бд была запись даты создания пользователя, а также даты обновления модели
// mongoose это делает для нас
// указываем интерфейс, чтобы подхватывались типы
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    bio: { type: String },
    image: { type: String },
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
