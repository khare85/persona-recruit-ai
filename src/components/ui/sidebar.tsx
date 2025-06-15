
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { X } from "lucide-react" 

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet" 
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

type SidebarContextValue = {
  state: "expanded" | "collapsed"
  open: boolean 
  setOpen: (open: boolean) => void
  openMobile: boolean 
  setOpenMobile: (open: boolean) => void
  isMobile: boolean | undefined // Changed to allow undefined initially
  toggleSidebar: () => void
  effectiveCollapsibleMode: "offcanvas" | "icon" | "none"
  hasMounted: boolean
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

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
    const isMobileHook = useIsMobile(); // Hook result can be boolean or undefined
    const [isMobile, setIsMobileState] = React.useState<boolean | undefined>(undefined);
    const [hasMounted, setHasMounted] = React.useState(false);
    const [openMobile, setOpenMobile] = React.useState(false);
    const [_open, _setOpen] = React.useState(defaultOpen);
    
    React.useEffect(() => {
      setIsMobileState(isMobileHook); // Update state once hook resolves
      setHasMounted(true);
      if (isMobileHook === false) { // Check explicitly for false, as undefined means not yet determined
        const cookieValue = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
          ?.split("=")[1];
        if (cookieValue) {
          _setOpen(cookieValue === 'true');
        }
      }
    }, [isMobileHook]);


    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
        if (isMobile === false && hasMounted) { 
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
        }
      },
      [setOpenProp, open, isMobile, hasMounted]
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
    // Determine effectiveCollapsibleMode only after mount and isMobile is determined
    const effectiveCollapsibleMode = !hasMounted || isMobile === undefined ? "icon" : (isMobile ? "offcanvas" : "icon");


    const contextValue = React.useMemo<SidebarContextValue>(
      () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, effectiveCollapsibleMode, hasMounted }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, effectiveCollapsibleMode, hasMounted]
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
    collapsible?: "offcanvas" | "icon" | "none" 
  }
>(
  (
    { side = "left", collapsible = "icon", className, children, ...props },
    ref
  ) => {
    const { state, openMobile, setOpenMobile, effectiveCollapsibleMode, hasMounted } = useSidebar()
    
    // On initial render (server or pre-hydration), don't render mobile specific parts if not mounted
    if (!hasMounted && effectiveCollapsibleMode === "offcanvas") {
        return null; // Or a placeholder/skeleton
    }

    if (effectiveCollapsibleMode === "none") {
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
    
    if (effectiveCollapsibleMode === "offcanvas") { 
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            data-sidebar="sidebar"
            data-collapsible="offcanvas"
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
          "group/sidebar peer hidden md:flex flex-col text-sidebar-foreground bg-sidebar transition-all duration-300 ease-in-out h-svh",
          side === "left" ? "border-r border-sidebar-border" : "border-l border-sidebar-border",
          state === "expanded" ? "w-[--sidebar-width]" : "w-[--sidebar-width-icon]",
          className
        )}
        data-state={state}
        data-collapsible={effectiveCollapsibleMode} 
        {...props}
      >
        {children}
         {effectiveCollapsibleMode === 'icon' && <SidebarRail />}
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"


const SidebarTrigger = React.forwardRef< 
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar, effectiveCollapsibleMode } = useSidebar()

  if (effectiveCollapsibleMode !== "offcanvas") return null; 

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
    const { toggleSidebar, effectiveCollapsibleMode, state } = useSidebar();
    if (effectiveCollapsibleMode !== 'icon') return null;
    
    const label = state === "collapsed" ? "Expand sidebar" : "Collapse sidebar";

    return (
      <button
        ref={ref}
        data-sidebar="rail"
        aria-label={label}
        title={`${label} (Ctrl+${SIDEBAR_KEYBOARD_SHORTCUT})`}
        onClick={toggleSidebar}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-20 h-10 w-2 items-center justify-center opacity-0 group-hover/sidebar-wrapper:opacity-100 transition-opacity cursor-pointer",
          "group-data-[side=left]/sidebar-wrapper:-right-1 group-data-[side=right]/sidebar-wrapper:-left-1", 
          "hidden md:flex", 
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


const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { effectiveCollapsibleMode } = useSidebar();
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
        {effectiveCollapsibleMode === "offcanvas" && ( 
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="mr-2 text-sidebar-foreground hover:bg-sidebar-accent/20">
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
  "peer/menu-button flex w-full items-center gap-2.5 overflow-hidden rounded-md text-left text-sm outline-none ring-sidebar-ring transition-colors duration-150 focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
      },
      sizeMode: {
        expanded: "p-2.5",
        collapsed: "justify-center px-0 py-2.5 size-10",
      }
    },
    defaultVariants: {
      variant: "default",
      sizeMode: "expanded",
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
    const Comp = asChild ? Slot : "button";
    const { isMobile, state: sidebarState, effectiveCollapsibleMode } = useSidebar();
    
    const currentSizeMode = (effectiveCollapsibleMode === 'icon' && sidebarState === 'collapsed' && !isMobile) ? 'collapsed' : 'expanded';

    const buttonContent = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, sizeMode: currentSizeMode, className }))}
        {...props}
      >
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && child.type === 'span') {
            return React.cloneElement(child as React.ReactElement<React.HTMLAttributes<HTMLSpanElement>>, {
              className: cn(
                child.props.className,
                "truncate", 
                (currentSizeMode === 'collapsed') ? "hidden" : "inline" // Hide span if collapsed on desktop
              )
            });
          }
          return child;
        })}
      </Comp>
    );

    // No tooltips on mobile or when expanded
    if (isMobile || currentSizeMode === "expanded" || !tooltip) {
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger, 
  useSidebar,
}
