
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft, X } from "lucide-react" 

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet" 
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem" 
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3.5rem" 
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean 
  setOpen: (open: boolean) => void
  openMobile: boolean 
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void 
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean 
    open?: boolean 
    onOpenChange?: (open: boolean) => void 
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)
    const [_open, _setOpen] = React.useState(defaultOpen)

    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
        if (!isMobile) { 
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
        }
      },
      [setOpenProp, open, isMobile]
    )

    const toggleSidebar = React.useCallback(() => {
      if (isMobile) {
        setOpenMobile((current) => !current)
      } else {
        setOpen((current) => !current)
      }
    }, [isMobile, setOpen, setOpenMobile])

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          toggleSidebar()
        }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={{
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON, 
                ...style,
              } as React.CSSProperties
            }
            className={cn("group/sidebar-wrapper flex min-h-svh w-full", className)}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" 
    collapsible?: "offcanvas" | "icon" | "none" 
  }
>(
  (
    { side = "left", variant = "sidebar", collapsible = "icon", className, children, ...props },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar() // Removed open, setOpen as they are for desktop
    const currentCollapsible = isMobile ? "offcanvas" : collapsible;


    if (currentCollapsible === "none") {
      return (
        <div
          className={cn("flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground", className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }
    
    if (isMobile) { 
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground flex flex-col" 
            style={{ "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
            side={side}
            showClose={false} 
          >
            {children}
          </SheetContent>
        </Sheet>
      )
    }
    
    
    return (
      <div
        ref={ref}
        className={cn(
          "group peer hidden md:flex flex-col text-sidebar-foreground bg-sidebar transition-all duration-300 ease-in-out h-svh",
          side === "left" ? "border-r" : "border-l",
          state === "expanded" ? "w-[--sidebar-width]" : "w-[--sidebar-width-icon]",
          className
        )}
        data-state={state}
        data-collapsible={collapsible} // This should be "icon" for desktop
        {...props}
      >
        {children}
         {collapsible === 'icon' && <SidebarRail />}
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"


const SidebarTrigger = React.forwardRef< 
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar, isMobile } = useSidebar()

  if (!isMobile) return null; 

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 md:hidden", className)} 
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    />
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar(); // Removed state, not needed here for functionality
    return (
      <button
        ref={ref}
        data-sidebar="rail"
        aria-label="Toggle Sidebar"
        title="Toggle Sidebar"
        onClick={toggleSidebar}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-20 h-10 w-2 group-data-[side=left]:-right-1 group-data-[side=right]:-left-1 hidden md:flex items-center justify-center opacity-0 group-hover/sidebar-wrapper:opacity-100 transition-opacity cursor-pointer",
          className
        )}
        {...props}
      >
        <div className="h-6 w-1 rounded-full bg-muted-foreground/30 group-hover/sidebar-wrapper:bg-muted-foreground/50" />
      </button>
    );
  }
);
SidebarRail.displayName = "SidebarRail";


const SidebarInset = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
    return (
        <div
        ref={ref}
        className={cn(
            "flex-1 flex flex-col overflow-hidden", 
            className
        )}
        {...props}
        />
    );
    }
);
SidebarInset.displayName = "SidebarInset";


const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { isMobile } = useSidebar(); // Removed toggleSidebar, as X button is handled by SheetClose
    return (
      <div
        ref={ref}
        data-sidebar="header"
        className={cn(
          "flex items-center justify-between min-h-[3.5rem]", 
          className
        )}
        {...props}
      >
        {children}
        {isMobile && ( 
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="mr-2 text-sidebar-foreground">
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </SheetClose>
        )}
      </div>
    );
  }
);
SidebarHeader.displayName = "SidebarHeader"


const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
    ({ className, ...props }, ref) => {
    return (
        <div
        ref={ref}
        data-sidebar="footer"
        className={cn("mt-auto", className)} 
        {...props}
        />
    );
    }
);
SidebarFooter.displayName = "SidebarFooter";


const SidebarSeparator = React.forwardRef< React.ElementRef<typeof Separator>, React.ComponentProps<typeof Separator>>(({ className, ...props }, ref) => {
  return (
    <Separator ref={ref} data-sidebar="separator" className={cn("mx-2 w-auto bg-sidebar-border", className)} {...props} />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"


const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
    ({ className, ...props }, ref) => {
    return (
        <div
        ref={ref}
        data-sidebar="content"
        className={cn(
            "flex-grow overflow-y-auto overflow-x-hidden", 
            
            className
        )}
        {...props}
        />
    );
    }
);
SidebarContent.displayName = "SidebarContent";

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
    ({ className, ...props }, ref) => (
    <ul
        ref={ref}
        data-sidebar="menu"
        className={cn("flex w-full min-w-0 flex-col gap-0.5", className)}
        {...props}
    />
    )
);
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
    ({ className, ...props }, ref) => (
    <li
        ref={ref}
        data-sidebar="menu-item"
        className={cn("group/menu-item relative", className)}
        {...props}
    />
    )
);
SidebarMenuItem.displayName = "SidebarMenuItem";


const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2.5 overflow-hidden rounded-md p-2.5 text-left text-sm outline-none ring-sidebar-ring transition-colors duration-150 focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5 group-data-[collapsible=icon]:size-10",
  // The following line is crucial for hiding/showing text in icon-collapsible mode
  // It hides the last span child when the sidebar group is icon-collapsible AND collapsed.
  "group-data-[collapsible=icon]:group-data-[state=collapsed]:[&>span:last-child]:hidden",
  // And ensures it's inline (or your preferred display type) when expanded
  "group-data-[collapsible=icon]:group-data-[state=expanded]:[&>span:last-child]:inline",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    { asChild = false, isActive = false, variant, tooltip, className, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state: sidebarState, open: desktopOpen } = useSidebar()
    


    const buttonContent = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, className }))}
        {...props}
      >
        {children}
      </Comp>
    )

    if (!tooltip || isMobile || sidebarState === "expanded") {
      return buttonContent;
    }
    
    
    const tooltipProps = typeof tooltip === "string" ? { children: tooltip } : tooltip;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent side="right" align="center" sideOffset={6} {...tooltipProps} />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"


export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset, 
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger, 
  useSidebar,
}
