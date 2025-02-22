import { FC } from "react"
import Link from "next/link"
import Image from "next/image"
import ROUTES from "@/constants/routes"
import { getDeviconClassName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface Props {
  _id: string
  name: string
  questions?: number
  showCount?: boolean
  compact?: boolean
}

const TagCard: FC<Props> = ({ _id, name, questions, showCount, compact }) => {
  const iconClass = getDeviconClassName(name)

  return (
    <Link href={ROUTES.TAGS(_id)} className="flex justify-between gap-2">
      <Badge className="subtle-medium background-light800_dark300 text-light400_light500 flex flex-row gap-2 rounded-md border-none px-4 py-2 uppercase">
        <div className="flex-center space-x-2">
          <i className={`${iconClass} text-sm`}></i>
          <span>{name}</span>
        </div>
        {/* <Image */}
        {/*  src="/icons/close.svg" */}
        {/*  width={12} */}
        {/*  height={12} */}
        {/*  alt="close icon" */}
        {/*  className="cursor-pointer object-contain invert-0 dark:invert" */}
        {/* /> */}
      </Badge>

      {showCount && (
        <p className="small-medium text-dark500_light700">{questions}</p>
      )}
    </Link>
  )
}

export default TagCard
