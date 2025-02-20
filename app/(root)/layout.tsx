import Navbar from "@/components/navigation/navbar"
import { FC, PropsWithChildren } from "react"

const RootLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

export default RootLayout
