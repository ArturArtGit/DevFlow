import { model, models, Schema, Types, Document, Model } from "mongoose"

export interface ICollection {
  author: Types.ObjectId
  question: Types.ObjectId
}

export interface ICollectionDoc extends ICollection, Document<string> {}

const CollectionSchema = new Schema<ICollection>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
  },
  { timestamps: true },
)

const Collection =
  (models?.Collection as Model<ICollectionDoc>) ||
  model<ICollection>("Collection", CollectionSchema)

export default Collection
