import TagCard from "@/components/cards/TagCard"
import { Preview } from "@/components/editor/Preview"
import Metric from "@/components/Metric"
import UserAvatar from "@/components/UserAvatar"
import ROUTES from "@/constants/routes"
import { after } from "next/server"
import { formatNumber, getTimeStamp } from "@/lib/utils"
import Link from "next/link"
import React, { Suspense } from "react"
import { RouteParams, Tag } from "@/types/global"
import { getQuestion, incrementViews } from "@/lib/actions/question.action"
import { notFound } from "next/navigation"
import AnswerForm from "@/components/forms/AnswerForm"
import { getAnswers } from "@/lib/actions/answer.action"
import AllAnswers from "@/components/answers/AllAnswers"
import Votes from "@/components/votes/Votes"
import { hasVoted } from "@/lib/actions/vote.action"
import SaveQuestion from "@/components/questions/SaveQuestion"
import { hasSavedQuestion } from "@/lib/actions/collection.action"

const QuestionDetails = async ({ params }: RouteParams<null>) => {
  const { id } = await params

  const { success, data: question } = await getQuestion({ questionId: id })

  after(async () => {
    await incrementViews({ questionId: id })
  })

  if (!success || !question) return notFound()

  const {
    data: answersResult,
    error: answersError,
    success: areAnswersLoaded,
  } = await getAnswers({
    questionId: id,
    page: 1,
    pageSize: 10,
    filter: "latest",
  })

  const hasVotedPromise = hasVoted({
    targetId: question._id,
    targetType: "question",
  })

  const hasSavedQuestionPromise = hasSavedQuestion({
    questionId: question._id,
  })

  const { author, createdAt, answers, views, tags, content, title } =
    question || {}

  return (
    <>
      <div className="flex-start w-full flex-col">
        <div className="flex w-full flex-col-reverse justify-between">
          <div className="flex items-center justify-start gap-1">
            <UserAvatar
              imageUrl={author.image}
              userId={author._id}
              name={author.name}
              className="size-[22px]"
              fallbackClassName="text-[10px]"
            />
            <Link href={ROUTES.PROFILE(author._id)}>
              <p className="paragraph-semibold text-dark300_light700">
                {author.name}
              </p>
            </Link>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Suspense fallback={<div>Loading...</div>}>
              <Votes
                targetType="question"
                targetId={question._id}
                upvotes={question.upvotes}
                downvotes={question.downvotes}
                hasVotedPromise={hasVotedPromise}
              />
            </Suspense>

            <Suspense fallback={<div>Loading...</div>}>
              <SaveQuestion
                questionId={question._id}
                hasSavedQuestionPromise={hasSavedQuestionPromise}
              />
            </Suspense>
          </div>
        </div>

        <h2 className="h2-semibold text-dark200_light900 mt-3.5 w-full">
          {title}
        </h2>
      </div>

      <div className="mb-8 mt-5 flex flex-wrap gap-4">
        <Metric
          imgUrl="/icons/clock.svg"
          alt="clock icon"
          value={` asked ${getTimeStamp(createdAt!)}`}
          title=""
          textStyles="small-regular text-dark400_light700"
        />
        <Metric
          imgUrl="/icons/message.svg"
          alt="message icon"
          value={answers}
          title=""
          textStyles="small-regular text-dark400_light700"
        />
        <Metric
          imgUrl="/icons/eye.svg"
          alt="eye icon"
          value={formatNumber(views)}
          title=""
          textStyles="small-regular text-dark400_light700"
        />
      </div>

      <Preview content={content} />

      <div className="mt-8 flex flex-wrap gap-2">
        {tags.map((tag: Tag) => (
          <TagCard
            key={tag._id}
            _id={tag._id as string}
            name={tag.name}
            compact
          />
        ))}
      </div>

      <section className="my-5">
        <AllAnswers
          data={answersResult?.answers}
          success={areAnswersLoaded}
          error={answersError}
          totalAnswers={answersResult?.totalAnswers || 0}
        />
      </section>

      <section className="my-5">
        <AnswerForm
          questionId={question._id}
          questionTitle={question.title}
          questionContent={question.content}
        />
      </section>
    </>
  )
}

export default QuestionDetails
