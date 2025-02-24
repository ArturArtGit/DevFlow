import { model, models, Schema, Types, Document } from "mongoose"

export interface IVote {
  author: Types.ObjectId
  actionId: Types.ObjectId
  actionType: "question" | "answer"
  voteType: "upvote" | "downvote"
}

// We can't create a new interface IVoteDoc if IVote includes an id field. This is because the Document interface already has an id field, which is a string, while the id field in IVote is of ObjectId type.
// To avoid this conflict, we rename id to actionId and type to actionType. This allows us to extend the Document interface with the IVote interface smoothly.

export interface IVoteDoc extends IVote, Document {}

const VoteSchema = new Schema<IVote>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actionId: { type: Schema.Types.ObjectId, required: true },
    actionType: { type: String, enum: ["question", "answer"], required: true },
    voteType: { type: String, enum: ["upvote", "downvote"], required: true },
  },
  { timestamps: true },
)

const Vote = models?.Vote || model<IVote>("Vote", VoteSchema)

export default Vote
