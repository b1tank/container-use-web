import { useNavigate } from "@tanstack/react-router"
import {
    Eye,
    FileText,
    Folder,
    GitBranch,
    GitCompare,
    Plug,
    RefreshCw,
    Server,
    Terminal,
} from "lucide-react"
import { useCallback, useState } from "react"
import { DefaultService } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import { DiffViewer } from "./sections/DiffViewer"
import type { ActionType } from "./sections/EnvironmentViewer"
import { EnvironmentViewer } from "./sections/EnvironmentViewer"
import { GitViewer } from "./sections/GitViewer"
import { LogViewer } from "./sections/LogViewer"
import { TerminalViewer } from "./sections/TerminalViewer"
import { WatchViewer } from "./sections/WatchViewer"
import { WorkspaceViewer } from "./sections/WorkspaceViewer"

interface ContainerUseDashboardProps {
    folder?: string
    cli?: string
}

type ViewType = "terminal" | "logs" | "diff"

interface ActiveViews {
    terminal: string | null
    logs: string | null
    diff: string | null
}

export function ContainerUseDashboard({
    folder,
    cli,
}: ContainerUseDashboardProps) {
    const navigate = useNavigate()

    const [activeViews, setActiveViews] = useState<ActiveViews>({
        terminal: null,
        logs: null,
        diff: null,
    })

    const [watchConnected, setWatchConnected] = useState<boolean>(false)

    const [environmentStatus, setEnvironmentStatus] = useState<{
        hasEnvironments: boolean
        isLoading: boolean
        hasError: boolean
    }>({
        hasEnvironments: false,
        isLoading: true,
        hasError: false,
    })

    const handleViewAction = useCallback(
        (environmentId: string, viewType: ViewType) => {
            setActiveViews((prev) => ({
                ...prev,
                [viewType]:
                    prev[viewType] === environmentId ? null : environmentId,
            }))
        },
        [],
    )

    const handleEnvironmentStatusChange = useCallback(
        (hasEnvironments: boolean, isLoading: boolean, hasError: boolean) => {
            setEnvironmentStatus({ hasEnvironments, isLoading, hasError })
        },
        [],
    )

    const handleWatchToggle = useCallback(() => {
        setWatchConnected((prev) => !prev)
    }, [])

    const handleTerminalReload = useCallback((environmentId: string) => {
        // Force reload the terminal by clearing and setting the active view
        setActiveViews((prev) => ({
            ...prev,
            terminal: null,
        }))
        // Use setTimeout to ensure the terminal is properly cleared before reloading
        setTimeout(() => {
            setActiveViews((prev) => ({
                ...prev,
                terminal: environmentId,
            }))
        }, 100)
    }, [])

    const handleEnvironmentAction = useCallback(
        async (environmentId: string, actionType: ActionType) => {
            try {
                console.log(
                    `Executing ${actionType} for environment:`,
                    environmentId,
                )

                if (actionType === "apply") {
                    const result =
                        await DefaultService.postApiV1EnvironmentsByIdApply({
                            id: environmentId,
                            ...(folder && { folder }),
                            ...(cli && { cli }),
                        })
                    console.log("Apply result:", result)
                    // You could add a toast notification here for success
                } else if (actionType === "merge") {
                    const result =
                        await DefaultService.postApiV1EnvironmentsByIdMerge({
                            id: environmentId,
                            ...(folder && { folder }),
                            ...(cli && { cli }),
                        })
                    console.log("Merge result:", result)
                    // You could add a toast notification here for success
                } else if (actionType === "checkout") {
                    const result =
                        await DefaultService.postApiV1EnvironmentsByIdCheckout({
                            id: environmentId,
                            ...(folder && { folder }),
                            ...(cli && { cli }),
                        })
                    console.log("Checkout result:", result)
                    // You could add a toast notification here for success
                }
            } catch (error) {
                console.error(`Failed to ${actionType} environment:`, error)
                // You could add a toast notification here for error
            }
        },
        [folder, cli],
    )

    const handleWorkspaceFolderChange = useCallback(
        (newFolder: string) => {
            // If no environments are currently loaded (empty or error state),
            // automatically reload environments for the new folder
            if (
                !environmentStatus.hasEnvironments &&
                !environmentStatus.isLoading
            ) {
                console.log(
                    "No environments found, auto-loading for new folder:",
                    newFolder,
                )
                navigate({
                    to: "/",
                    search: {
                        folder: newFolder,
                        ...(cli && { cli }),
                    },
                })
            } else {
                // If environments are already loaded, don't automatically change
                // Users must explicitly choose "Show environments here" from the dropdown menu
                console.log(
                    "Environments exist, folder changed but not auto-loading:",
                    newFolder,
                )
            }
        },
        [
            environmentStatus.hasEnvironments,
            environmentStatus.isLoading,
            navigate,
            cli,
        ],
    )

    const handleShowEnvironments = useCallback(
        (newFolder: string) => {
            // Update the URL search parameters to reflect the new folder
            navigate({
                to: "/",
                search: {
                    folder: newFolder,
                    ...(cli && { cli }),
                },
            })
        },
        [navigate, cli],
    )

    // Determine if views should be disabled (no environments available and not loading)
    const shouldDisableViews =
        !environmentStatus.hasEnvironments && !environmentStatus.isLoading

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Main horizontal layout: Left (3/4) + Right (1/4) */}
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* Left Section (3/4) - Workspace + Watch + Terminal */}
                    <ResizablePanel defaultSize={75} minSize={60} maxSize={85}>
                        <ResizablePanelGroup
                            direction="vertical"
                            className="h-full"
                        >
                            {/* Top: Workspace */}
                            <ResizablePanel defaultSize={40} minSize={25}>
                                <Card className="h-full rounded-none border-r-0 border-l-0 border-t-0 border-b-0">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Folder className="h-5 w-5" />
                                            Workspace
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-2rem)] overflow-hidden">
                                        <WorkspaceViewer
                                            initialFolder={folder}
                                            onFolderChange={
                                                handleWorkspaceFolderChange
                                            }
                                            onShowEnvironments={
                                                handleShowEnvironments
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Middle: Watch */}
                            <ResizablePanel defaultSize={30} minSize={20}>
                                <Card
                                    className={`h-full rounded-none border-t border-l-0 border-r-0 border-b-0 ${shouldDisableViews ? "opacity-50" : ""}`}
                                >
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Eye
                                                    className={`h-5 w-5 ${shouldDisableViews ? "text-muted-foreground" : ""}`}
                                                />
                                                <span
                                                    className={
                                                        shouldDisableViews
                                                            ? "text-muted-foreground"
                                                            : ""
                                                    }
                                                >
                                                    Watch
                                                </span>
                                                {!shouldDisableViews &&
                                                    watchConnected && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 relative border border-green-400/60 hover:bg-primary/10"
                                                            disabled
                                                        >
                                                            <Plug className="h-3 w-3 text-green-600" />
                                                            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                                        </Button>
                                                    )}
                                            </div>
                                            {!shouldDisableViews && (
                                                <Button
                                                    variant={
                                                        watchConnected
                                                            ? "ghost"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={handleWatchToggle}
                                                    className={`text-xs h-6 px-2 ${
                                                        watchConnected
                                                            ? "text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                            : "border-green-400/60 text-green-700 hover:bg-green-50 hover:text-green-800"
                                                    }`}
                                                >
                                                    {watchConnected
                                                        ? "Disconnect"
                                                        : "Connect"}
                                                </Button>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        {shouldDisableViews ? (
                                            <div className="flex items-center justify-center h-full bg-muted/20">
                                                <div className="text-center space-y-2">
                                                    <div className="text-2xl text-muted-foreground">
                                                        👁️
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        No Environments
                                                    </div>
                                                    <div className="text-xs text-muted-foreground/70">
                                                        Create an environment to
                                                        enable watch
                                                    </div>
                                                </div>
                                            </div>
                                        ) : !watchConnected ? (
                                            <div className="flex items-center justify-center h-full bg-muted/20">
                                                <div className="text-center space-y-2">
                                                    <div className="text-2xl text-muted-foreground">
                                                        👁️
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Environments available
                                                    </div>
                                                    <div className="text-xs text-muted-foreground/70">
                                                        Click Connect to start
                                                        watching
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <WatchViewer
                                                folder={folder}
                                                cli={cli}
                                                connected={watchConnected}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Bottom: Terminal */}
                            <ResizablePanel defaultSize={30} minSize={20}>
                                <Card
                                    className={`h-full rounded-none border-t border-l-0 border-r-0 border-b-0 ${shouldDisableViews ? "opacity-50" : ""}`}
                                >
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Terminal
                                                    className={`h-5 w-5 ${shouldDisableViews ? "text-muted-foreground" : ""}`}
                                                />
                                                <span
                                                    className={
                                                        shouldDisableViews
                                                            ? "text-muted-foreground"
                                                            : ""
                                                    }
                                                >
                                                    Terminal
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {activeViews.terminal && (
                                                    <>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs font-mono px-2 py-0.5 bg-gradient-to-r from-green-100 to-teal-100 border-green-400/70 text-green-800 shadow-md transition-all"
                                                        >
                                                            {
                                                                activeViews.terminal
                                                            }
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 hover:bg-primary/10"
                                                            onClick={() =>
                                                                activeViews.terminal &&
                                                                handleTerminalReload(
                                                                    activeViews.terminal,
                                                                )
                                                            }
                                                            title={`Reload terminal for ${activeViews.terminal}`}
                                                        >
                                                            <RefreshCw className="h-3 w-3" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        {shouldDisableViews ? (
                                            <div className="flex items-center justify-center h-full bg-black/10">
                                                <div className="text-center space-y-2">
                                                    <div className="text-2xl text-muted-foreground">
                                                        💻
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        No Environments
                                                    </div>
                                                    <div className="text-xs text-muted-foreground/70">
                                                        Select an environment to
                                                        open terminal
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <TerminalViewer
                                                environmentId={
                                                    activeViews.terminal
                                                }
                                                folder={folder}
                                                cli={cli}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Right Section (1/4) - Environment + Git + Log + Diff */}
                    <ResizablePanel defaultSize={25} minSize={25} maxSize={40}>
                        <ResizablePanelGroup
                            direction="vertical"
                            className="h-full"
                        >
                            {/* Environment Section */}
                            <ResizablePanel defaultSize={25} minSize={15}>
                                <Card className="h-full rounded-none border-l border-r-0 border-t-0 border-b-0">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Server className="h-5 w-5" />
                                            Environments
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        <EnvironmentViewer
                                            onViewAction={handleViewAction}
                                            onEnvironmentAction={
                                                handleEnvironmentAction
                                            }
                                            folder={folder}
                                            cli={cli}
                                            activeViews={activeViews}
                                            onEnvironmentStatusChange={
                                                handleEnvironmentStatusChange
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Git Section */}
                            <ResizablePanel defaultSize={25} minSize={15}>
                                <Card className="h-full rounded-none border-l border-t border-r-0 border-b-0">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <GitBranch className="h-5 w-5" />
                                            Git
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        {folder ? (
                                            <GitViewer folder={folder} />
                                        ) : (
                                            <div className="flex items-center justify-center h-full bg-muted/10">
                                                <div className="text-center space-y-2">
                                                    <div className="text-2xl text-muted-foreground">
                                                        📁
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        No folder selected
                                                    </div>
                                                    <div className="text-xs text-muted-foreground/70">
                                                        Select a workspace
                                                        folder to view git
                                                        status
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Log Section */}
                            <ResizablePanel defaultSize={25} minSize={15}>
                                <Card
                                    className={`h-full rounded-none border-l border-t border-r-0 border-b-0 ${shouldDisableViews ? "opacity-50" : ""}`}
                                >
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText
                                                    className={`h-5 w-5 ${shouldDisableViews ? "text-muted-foreground" : ""}`}
                                                />
                                                <span
                                                    className={
                                                        shouldDisableViews
                                                            ? "text-muted-foreground"
                                                            : ""
                                                    }
                                                >
                                                    Logs
                                                </span>
                                            </div>
                                            {activeViews.logs && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs font-mono px-2 py-0.5 bg-gradient-to-r from-green-100 to-teal-100 border-green-400/70 text-green-800 shadow-md transition-all"
                                                >
                                                    {activeViews.logs}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        {shouldDisableViews ? (
                                            <div className="flex items-center justify-center h-full bg-muted/20">
                                                <div className="text-center space-y-2">
                                                    <div className="text-2xl text-muted-foreground">
                                                        📋
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        No Environments
                                                    </div>
                                                    <div className="text-xs text-muted-foreground/70">
                                                        Select an environment to
                                                        view logs
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <LogViewer
                                                environmentId={activeViews.logs}
                                                folder={folder}
                                                cli={cli}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Diff Section */}
                            <ResizablePanel defaultSize={25} minSize={15}>
                                <Card
                                    className={`h-full rounded-none border-l border-t border-r-0 border-b-0 ${shouldDisableViews ? "opacity-50" : ""}`}
                                >
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GitCompare
                                                    className={`h-5 w-5 ${shouldDisableViews ? "text-muted-foreground" : ""}`}
                                                />
                                                <span
                                                    className={
                                                        shouldDisableViews
                                                            ? "text-muted-foreground"
                                                            : ""
                                                    }
                                                >
                                                    Diff
                                                </span>
                                            </div>
                                            {activeViews.diff && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs font-mono px-2 py-0.5 bg-gradient-to-r from-green-100 to-teal-100 border-green-400/70 text-green-800 shadow-md transition-all"
                                                >
                                                    {activeViews.diff}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        {shouldDisableViews ? (
                                            <div className="flex items-center justify-center h-full bg-muted/20">
                                                <div className="text-center space-y-2">
                                                    <div className="text-2xl text-muted-foreground">
                                                        🔍
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        No Environments
                                                    </div>
                                                    <div className="text-xs text-muted-foreground/70">
                                                        Select an environment to
                                                        view diffs
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <DiffViewer
                                                environmentId={activeViews.diff}
                                                folder={folder}
                                                cli={cli}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}
