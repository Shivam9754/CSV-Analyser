"use client"
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_ICON = "3.5rem"

type SidebarContextValue = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (v: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue>({
  state: "expanded",
  open: true,
  setOpen: () => {},
  toggleSidebar: () => {},
})

function useSidebar() {
  return React.useContext(SidebarContext)
}

function SidebarProvider({ defaultOpen = true, children, className, style, ...props }: React.ComponentProps<"div"> & { defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen)
  const state = open ? "expanded" : "collapsed"
  const toggleSidebar = React.useCallback(() => setOpen(v => !v), [])
  return (
    <SidebarContext.Provider value={{ state, open, setOpen, toggleSidebar }}>
      <div
        data-sidebar-state={state}
        className={cn("group/sidebar-wrapper flex min-h-svh w-full", className)}
        style={{ "--sidebar-width": SIDEBAR_WIDTH, "--sidebar-width-icon": SIDEBAR_WIDTH_ICON, ...style } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function Sidebar({ side = "left", collapsible = "offcanvas", className, children, ...props }: React.ComponentProps<"div"> & { side?: "left" | "right"; collapsible?: "offcanvas" | "icon" | "none" }) {
  const { state } = useSidebar()
  return (
    <div
      data-state={state}
      data-collapsible={collapsible}
      className={cn(
        "group peer hidden md:block text-sidebar-foreground",
        className
      )}
      {...props}
    >
      <div className={cn(
        "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
        "group-data-[collapsible=offcanvas]:w-0",
        "group-data-[collapsible=icon]:group-data-[state=collapsed]:w-[--sidebar-width-icon]",
        "group-data-[collapsible=icon]:overflow-hidden",
      )} />
      <div className={cn(
        "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
        "left-0 border-r",
        "group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]",
        "group-data-[collapsible=icon]:group-data-[state=collapsed]:w-[--sidebar-width-icon] group-data-[collapsible=icon]:overflow-hidden",
        "bg-sidebar",
      )}>
        <div data-sidebar="sidebar" className="flex h-full w-full flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(e) => { onClick?.(e); toggleSidebar() }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "duration-200 ease-linear transition-[margin-left]",
        className
      )}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-sidebar="header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-sidebar="footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-sidebar="content" className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto", className)} {...props} />
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-sidebar="group" className={cn("relative flex w-full min-w-0 flex-col p-2", className)} {...props} />
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-sidebar="group-content" className={cn("w-full text-sm", className)} {...props} />
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props} />
}

const sidebarMenuButtonVariants = cn(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-6 [&>svg]:shrink-0",
  "group-data-[collapsible=icon]:group-data-[state=collapsed]:!size-8 group-data-[collapsible=icon]:group-data-[state=collapsed]:!p-2 group-data-[collapsible=icon]:group-data-[state=collapsed]:[&>span:last-child]:hidden group-data-[collapsible=icon]:group-data-[state=collapsed]:[&>svg]:size-4"
)

interface SidebarMenuButtonProps extends React.ComponentProps<"button"> {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string
  size?: "default" | "sm" | "lg"
}

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ asChild = false, isActive = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants, className)}
        {...props}
      />
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn("absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex", className)}
      {...props}
    />
  )
}

export {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarRail, SidebarTrigger, useSidebar,
}
