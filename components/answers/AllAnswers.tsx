import { ActionResponse, Answer } from "@/types/global"
import DataRenderer from "@/components/DataRenderer"
import { EMPTY_ANSWERS } from "@/constants/states"
import AnswerCard from "@/components/cards/AnswerCard"

interface Props extends ActionResponse<Answer[]> {
  totalAnswers: number
}

const AllAnswers = ({ data, success, error, totalAnswers }: Props) => {
  return (
    <div className="mt-11">
      <div className="flex items-center justify-between">
        <h3 className="primary-text-gradient">
          {totalAnswers} {totalAnswers === 1 ? "Answers" : "Answers"}
        </h3>
        <p>Filters</p>
      </div>

      <DataRenderer
        success={success}
        data={data}
        empty={EMPTY_ANSWERS}
        render={(answers) =>
          answers.map((answer) => <AnswerCard key={answer._id} {...answer} />)
        }
        error={error}
      />
    </div>
  )
}

export default AllAnswers
