import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

type TouchTooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
  contentClassName?: string
  triggerClassName?: string
  sideOffset?: number
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

const TouchTooltip = ({
  content,
  children,
  contentClassName,
  triggerClassName,
  sideOffset,
}: TouchTooltipProps) => {
  const [open, setOpen] = React.useState(false)
  const autoDismissRef = React.useRef<number | null>(null)
  const triggerChild = React.isValidElement(children)
    ? children
    : <span>{children}</span>

  React.useEffect(() => {
    return () => {
      if (autoDismissRef.current) {
        window.clearTimeout(autoDismissRef.current)
        autoDismissRef.current = null
      }
    }
  }, [])

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        asChild
        className={triggerClassName}
        onPointerDown={(event) => {
          if (event.pointerType === "touch") {
            event.preventDefault()
            event.stopPropagation()
            setOpen((prev) => {
              const nextOpen = !prev
              if (autoDismissRef.current) {
                window.clearTimeout(autoDismissRef.current)
                autoDismissRef.current = null
              }
              if (nextOpen) {
                autoDismissRef.current = window.setTimeout(() => {
                  setOpen(false)
                  autoDismissRef.current = null
                }, 2000)
              }
              return nextOpen
            })
          }
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {triggerChild}
      </TooltipTrigger>
      <TooltipContent sideOffset={sideOffset} className={contentClassName}>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TouchTooltip }
