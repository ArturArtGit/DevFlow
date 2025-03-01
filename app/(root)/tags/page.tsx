import { getTags } from "@/lib/actions/tag.actions"
import { PaginatedSearchParams, RouteParams } from "@/types/global"
import ROUTES from "@/constants/routes"
import LocalSearch from "@/components/search/LocalSearch"
import DataRenderer from "@/components/DataRenderer"
import { EMPTY_TAGS } from "@/constants/states"
import TagCard from "@/components/cards/TagCard"

const TagsPage = async ({
  searchParams,
}: RouteParams<Promise<PaginatedSearchParams>>) => {
  const { page, pageSize, query, filter } = await searchParams
  const { success, data, error } = await getTags({
    page: Number(page) || 1,
    pageSize: Number(pageSize) || 10,
    query: query || "",
    filter: filter || "",
  })

  const { tags } = data || {}

  return (
    <>
      <h1 className="h1-bold text-dark100_light900 text-3xl">Tags</h1>

      <section className="mt-11">
        <LocalSearch
          route={ROUTES.TAGS}
          imgSrc="/icons/search.svg"
          placeholder="Search tags..."
          otherClasses="flex-1"
        />
      </section>

      <DataRenderer
        success={success}
        data={tags}
        error={error}
        empty={EMPTY_TAGS}
        render={(tags) => (
          <div className="mt-10 flex w-full flex-wrap gap-4">
            {tags.map((tag) => (
              <TagCard key={tag._id} {...tag} />
            ))}
          </div>
        )}
      />
    </>
  )
}

export default TagsPage
