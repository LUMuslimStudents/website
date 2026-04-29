import { HTMLMotionProps, motion, useInView } from "framer-motion"
import React from "react"
import type { Variants } from "framer-motion"

// Simplified to avoid complex generics and TS errors with framer-motion
type TimelineContentProps = {
  children?: React.ReactNode
  animationNum: number
  className?: string
  timelineRef: React.RefObject<HTMLElement | null>
  as?: "div" | "span" | "h1" | "h2" | "h3" | "h4" | "p" | "button" | "a" | "article"
  customVariants?: Variants
  once?: boolean
} & HTMLMotionProps<any>

export const TimelineContent = ({
  children,
  animationNum,
  timelineRef,
  className,
  as = "div",
  customVariants,
  once = false,
  ...props
}: TimelineContentProps) => {
  const defaultSequenceVariants = {
    visible: (i: number) => ({
      filter: "blur(0px)",
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.5,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(20px)",
      y: 0,
      opacity: 0,
    },
  }

  const sequenceVariants = customVariants || defaultSequenceVariants

  // useInView hook from framer-motion needs a ref
  const isInView = useInView(timelineRef as React.RefObject<Element>, {
    once
  })

  // @ts-ignore
  const MotionComponent = motion[as] as React.ElementType

  return (
    <MotionComponent
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      custom={animationNum}
      variants={sequenceVariants}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  )
}
