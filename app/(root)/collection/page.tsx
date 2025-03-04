import LocalSearch from "@/components/search/LocalSearch"
import ROUTES from "@/constants/routes"
import QuestionCard from "@/components/cards/QuestionCard"
import { PaginatedSearchParams, RouteParams } from "@/types/global"
import DataRenderer from "@/components/DataRenderer"
import { EMPTY_QUESTION } from "@/constants/states"
import { getSavedQuestions } from "@/lib/actions/collection.action"

const Collections = async ({
  searchParams,
}: RouteParams<PaginatedSearchParams>) => {
  const { query, filter, page, pageSize } =
    (await searchParams) as PaginatedSearchParams

  const { success, data, error } = await getSavedQuestions({
    page: Number(page) || 1,
    pageSize: Number(pageSize) || 10,
    query: query || "",
    filter: filter || "",
  })

  const { collections } = data || {}

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Saved Questions</h1>
      <section className="mt-11 flex justify-between gap-5 max-sm:flex-col sm:items-center">
        <LocalSearch
          route={ROUTES.COLLECTION}
          imgSrc="/icons/search.svg"
          placeholder="Search questions..."
          otherClasses="flex-1"
        />
      </section>

      <DataRenderer
        success={success}
        data={collections}
        error={error}
        empty={EMPTY_QUESTION}
        render={(collections) => (
          <div className="mt-10 flex w-full flex-col gap-6">
            {collections.map((collection) => (
              <QuestionCard
                key={collection._id}
                question={collection.question}
              />
            ))}
          </div>
        )}
      />
    </>
  )
}

export default Collections
