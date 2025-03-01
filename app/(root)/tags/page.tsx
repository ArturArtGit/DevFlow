import { getTags } from "@/lib/actions/tag.actions"

const TagsPage = async () => {
  const { success, data, error } = await getTags({
    page: 1,
    pageSize: 10,
    // query: "test",
  })

  const { tags } = data || {}

  console.log("tags", JSON.stringify(tags, null, 2))
  return <>TagsPage</>
}

export default TagsPage
