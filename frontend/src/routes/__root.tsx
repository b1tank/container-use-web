import { createRootRoute, Outlet } from "@tanstack/react-router"
import React, { Suspense } from "react"
import { ThemeProvider } from "@/components/ui/theme-provider"

// Loading fallback component
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
)

const loadDevtools = () =>
    Promise.all([import("@tanstack/react-router-devtools")]).then(
        ([reactRouterDevtools]) => {
            return {
                default: () => (
                    <>
                        <reactRouterDevtools.TanStackRouterDevtools
                            initialIsOpen={false}
                            closeButtonProps={{ style: { display: "none" } }}
                        />
                    </>
                ),
            }
        },
    )

const TanStackDevtools = import.meta.env.DEV
    ? React.lazy(loadDevtools)
    : () => null

if (import.meta.env.DEV) {
    // Add CTRL+Q keydown handler to toggle the dev tools overlay visibility
    let devToolsVisible = true

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.key.toLowerCase() === "q") {
            event.preventDefault()
            devToolsVisible = !devToolsVisible

            for (const el of document.querySelectorAll(
                ".tsqd-parent-container, .TanStackRouterDevtools",
            )) {
                ;(el as HTMLElement).style.display = devToolsVisible
                    ? ""
                    : "none"
            }
        }
    }

    window.addEventListener("keydown", handleKeyDown)
}

export const Route = createRootRoute({
    component: () => (
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <Suspense fallback={<LoadingFallback />}>
                <Outlet />
            </Suspense>
            <TanStackDevtools />
        </ThemeProvider>
    ),
})
