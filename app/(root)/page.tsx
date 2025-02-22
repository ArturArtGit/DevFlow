import { Button } from "@/components/ui/button"
import Link from "next/link"
import ROUTES from "@/constants/routes"
import LocalSearch from "@/components/search/LocalSearch"

const Home = async () => {
  return (
    <>
      <section className="flex w-full flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="h1-bold text-dark100_light900">All Questions</h1>

        <Button
          asChild
          className="primary-gradient min-h-[46px] px-4 py-3 !text-light-900"
        >
          <Link href={ROUTES.AKS_QUESTION}>Ask a Question</Link>
        </Button>
      </section>
      <section className="mt-11">
        <LocalSearch
          imgSrc="icons/search.svg"
          route="/"
          placeholder="Search questions..."
          otherClasses="flex-1"
        />
      </section>
      Filter
      <div className="mt-10 flex w-full flex-col gap-6">
        <p>Question Card 1</p>
        <p>Question Card 1</p>
        <p>Question Card 1</p>
        <p>Question Card 1</p>
      </div>
    </>
  )
}

export default Home
