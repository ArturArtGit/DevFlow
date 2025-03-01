"use client"

import { sidebarLinks } from "@/constants"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import ROUTES from "@/constants/routes"
import { SheetClose } from "@/components/ui/sheet"

const NavLinks = ({
  isMobileNav = false,
  userId,
}: {
  isMobileNav?: boolean
  userId?: string
}) => {
  const pathname = usePathname()

  return (
    <>
      {sidebarLinks.map((item) => {
        const isActive =
          (pathname.includes(item.route) && item.route.length > 1) ||
          pathname === item.route

        if (item.route === "/profile") {
          if (userId) item.route = ROUTES.PROFILE(userId)
          else return null
        }

        const LinkComponent = (
          <Link
            href={item.route}
            key={item.label}
            className={cn(
              isActive
                ? "primary-gradient rounded-lg text-light-900"
                : "text-dark300_light900",
              "flex items-center justify-start gap-4 bg-transparent p-4",
            )}
          >
            <Image
              src={item.imgURL}
              alt={item.label}
              width={20}
              height={20}
              className={cn({ "invert-colors": !isActive })}
            />
            <p
              className={cn(
                isActive ? "base-bold" : "base-medium",
                !isMobileNav && "max-lg:hidden",
              )}
            >
              {item.label}
            </p>
          </Link>
        )

        return isMobileNav ? (
          <SheetClose asChild key={item.route}>
            {LinkComponent}
          </SheetClose>
        ) : (
          LinkComponent
        )
      })}
    </>
  )
}

export default NavLinks
