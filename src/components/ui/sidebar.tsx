
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

// Static Sidebar: No context provider or complex state needed.

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" }
>(({ className, side = "left", ...props }, ref) => (
  <aside
    ref={ref}
    className={cn(
      "flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground", // Fixed width (w-64 -> 16rem)
      side === "left" ? "border-r border-sidebar-border" : "border-l border-sidebar-border",
      className
    )}
    {...props}
  />
))
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-14 items-center p-3", className)} // Ensure consistent height with topbar
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => (
  <Separator
    ref={ref}
    className={cn("mx-2 my-1 w-auto bg-sidebar-border/50", className)}
    {...props}
  />
))
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-grow overflow-y-auto overflow-x-hidden p-2", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex w-full min-w-0 flex-col gap-0.5", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-2.5 overflow-hidden rounded-md p-2.5 text-left text-sm outline-none ring-sidebar-ring transition-colors duration-150 focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
  {
    variants: {
      variant: {
        default: "", // Base styles are already applied
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
    isActive?: boolean
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(({ asChild = false, isActive = false, variant, className, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, className }))}
      {...props}
    >
      {/* Children (icon and span) are expected to be passed directly */}
      {children}
    </Comp>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
}
