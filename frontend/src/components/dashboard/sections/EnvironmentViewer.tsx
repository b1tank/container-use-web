import { useQuery } from "@tanstack/react-query"
import {
    Container,
    FileText,
    GitBranch,
    GitCompare,
    GitMerge,
    GitPullRequest,
    Loader2,
    RefreshCw,
    RotateCcw,
    Terminal,
    ToggleLeft,
    ToggleRight,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { DefaultService, type Environment } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type ViewType = "terminal" | "logs" | "diff"
export type ActionType = "apply" | "merge" | "checkout"

interface ActiveViews {
    terminal: string | null
    logs: string | null
    diff: string | null
}

interface EnvironmentViewerProps {
    onViewAction: (environmentId: string, viewType: ViewType) => void
    onEnvironmentAction?: (
        environmentId: string,
        actionType: ActionType,
    ) => void
    folder?: string
    cli?: string
    activeViews?: ActiveViews
    onEnvironmentStatusChange?: (
        hasEnvironments: boolean,
        isLoading: boolean,
        hasError: boolean,
    ) => void
}

export function EnvironmentViewer({
    onViewAction,
    onEnvironmentAction,
    folder,
    cli,
    activeViews,
    onEnvironmentStatusChange,
}: EnvironmentViewerProps) {
    const [autoRefresh, setAutoRefresh] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [actionInProgress, setActionInProgress] = useState<
        Record<string, ActionType | null>
    >({})

    const handleEnvironmentAction = useCallback(
        (environmentId: string, actionType: ActionType) => {
            // Set action as in progress
            setActionInProgress((prev) => ({
                ...prev,
                [environmentId]: actionType,
            }))

            // Call the original action handler
            onEnvironmentAction?.(environmentId, actionType)

            // Reset action state after 3 seconds
            setTimeout(() => {
                setActionInProgress((prev) => ({
                    ...prev,
                    [environmentId]: null,
                }))
            }, 3000)
        },
        [onEnvironmentAction],
    )

    const {
        data: environmentsResponse,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["environments", folder, cli], // Include params in query key for proper caching
        queryFn: () =>
            DefaultService.getApiV1Environments({
                ...(folder && { folder }),
                ...(cli && { cli }),
            }),
        retry: false, // Disable automatic retries to prevent error blinking
        refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds when auto-refresh is enabled
        refetchOnWindowFocus: false,
    })

    // Extract environments and git info from the response
    const environments = environmentsResponse?.environments
    const gitInfo = environmentsResponse?.gitInfo

    const handleManualRefresh = () => {
        refetch()
    }

    const toggleAutoRefresh = () => {
        setAutoRefresh((prev) => !prev)
    }

    // Notify parent component of environment status changes
    useEffect(() => {
        if (onEnvironmentStatusChange) {
            const hasEnvironments = !!(environments && environments.length > 0)
            const hasError = !!error
            onEnvironmentStatusChange(hasEnvironments, isLoading, hasError)
        }
    }, [environments, isLoading, error, onEnvironmentStatusChange])

    // Update last updated timestamp when environments data changes
    useEffect(() => {
        if (environmentsResponse && !isLoading) {
            setLastUpdated(new Date())
        }
    }, [environmentsResponse, isLoading])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-sm text-muted-foreground">
                    Loading environments...
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="text-2xl">❌</div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">
                            Failed to Load Environments
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            An error occurred while fetching environments.
                            Please check your configuration and try again.
                        </p>
                        {(folder || cli) && (
                            <div className="text-xs bg-muted/50 p-2 rounded border space-y-1">
                                <div className="font-medium">
                                    Current Configuration:
                                </div>
                                {folder && <div>📂 {folder}</div>}
                                {cli && <div>🛠️ CLI: {cli}</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Determine if we're in a git repository
    const isGitRepository = gitInfo?.isRepository
    const hasGitInfo = !!gitInfo

    if (!environments?.length) {
        // If we're not in a git repository, show git repo requirement message
        if (hasGitInfo && !isGitRepository) {
            return (
                <div className="flex items-center justify-center h-full p-4">
                    <div className="text-center space-y-4 max-w-sm">
                        <div className="text-2xl">🌳</div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">
                                Not a Git Repository
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                The selected folder is not a git repository or
                                git is not initialized.
                            </p>
                            {folder && (
                                <div className="text-xs bg-muted/50 p-2 rounded border space-y-1">
                                    <div className="font-medium">
                                        Current Folder:
                                    </div>
                                    <div>📂 {folder}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
        }

        // If we are in a git repository but no environments exist
        return (
            <div className="flex items-center justify-center h-full p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="text-2xl">🛠️</div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">
                            Ready to Get Started
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            No environments found in this git repository yet.
                            Create your first environment to begin.
                        </p>
                        {isGitRepository && gitInfo && (
                            <div className="text-xs bg-emerald-50 border border-emerald-200 p-2 rounded space-y-1">
                                <div className="font-medium text-emerald-800">
                                    ✅ Git Repository Detected
                                </div>
                                <div className="text-emerald-700">
                                    Current branch:{" "}
                                    {gitInfo.currentBranch || "unknown"}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Controls Header */}
            <div className="px-3 py-2 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        {lastUpdated ? (
                            <>
                                Last updated: {lastUpdated.toLocaleTimeString()}
                                {autoRefresh && " (auto-refresh enabled)"}
                            </>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                Last updated: {new Date().toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs h-6 w-6 rounded-full flex items-center justify-center p-0 bg-emerald-50 border-emerald-200 text-emerald-700 font-medium"
                                    >
                                        {environments?.length || 0}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent
                                    className="bg-background border border-border shadow-lg"
                                    arrowProps={{
                                        className:
                                            "fill-background bg-background border-0 size-2",
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Container className="h-4 w-4 text-emerald-600" />
                                        <p>
                                            {environments?.length || 0}{" "}
                                            environment
                                            {(environments?.length || 0) !== 1
                                                ? "s"
                                                : ""}
                                        </p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Button
                            onClick={toggleAutoRefresh}
                            size="sm"
                            variant={autoRefresh ? "default" : "outline"}
                            className="h-7 px-2"
                        >
                            <RotateCcw
                                className={`h-3 w-3 mr-1 ${autoRefresh ? "animate-spin" : ""}`}
                            />
                            Auto
                        </Button>
                        <Button
                            onClick={handleManualRefresh}
                            size="sm"
                            variant="outline"
                            disabled={isLoading}
                            className="h-7 px-2"
                        >
                            <RefreshCw
                                className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
                            />
                        </Button>
                    </div>
                </div>
                {(folder || cli) && (
                    <div className="text-xs text-muted-foreground mt-1 space-x-2">
                        {folder && <span>📂 {folder}</span>}
                        {cli && <span>🛠️ {cli}</span>}
                    </div>
                )}
            </div>

            {/* Environment List Content */}
            <div className="flex-1 overflow-auto">
                <div className="space-y-2 p-4">
                    {environments.map((env: Environment) => (
                        <Card
                            key={env.id}
                            className="p-3 transition-all hover:shadow-md hover:bg-muted/50"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm truncate">
                                        {env.title || "Untitled Environment"}
                                    </h4>
                                </div>
                                {/* Created/Updated info and Action Toolbar */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant="outline"
                                            className={`text-xs font-mono px-2 py-0.5 transition-all ${
                                                activeViews?.terminal ===
                                                    env.id ||
                                                activeViews?.logs === env.id ||
                                                activeViews?.diff === env.id
                                                    ? "bg-gradient-to-r from-green-100 to-teal-100 border-green-400/70 text-green-800 shadow-md"
                                                    : ""
                                            }`}
                                        >
                                            {env.id || "No ID"}
                                        </Badge>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <div>
                                                Created:{" "}
                                                {env.created || "Unknown"}
                                            </div>
                                            <div>
                                                Updated:{" "}
                                                {env.updated || "Unknown"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Horizontal Action Stack */}
                                    <div className="flex items-center justify-between">
                                        {/* Environment Actions Group (Left) */}
                                        <div
                                            className={`flex items-center rounded-md p-1 gap-0.5 transition-all ${
                                                actionInProgress[env.id || ""]
                                                    ? "bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50"
                                                    : "bg-muted/30"
                                            }`}
                                        >
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 rounded hover:bg-emerald-100 hover:text-emerald-700 transition-all relative"
                                                            disabled={
                                                                actionInProgress[
                                                                    env.id || ""
                                                                ] === "apply"
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                env.id &&
                                                                    handleEnvironmentAction(
                                                                        env.id,
                                                                        "apply",
                                                                    )
                                                            }}
                                                        >
                                                            {actionInProgress[
                                                                env.id || ""
                                                            ] === "apply" ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <GitPullRequest className="h-3 w-3" />
                                                            )}
                                                            {actionInProgress[
                                                                env.id || ""
                                                            ] === "apply" && (
                                                                <div className="absolute inset-0 bg-emerald-500/20 rounded animate-pulse" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>
                                                            {actionInProgress[
                                                                env.id || ""
                                                            ] === "apply"
                                                                ? "Applying Changes..."
                                                                : "Apply Environment Changes"}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 rounded hover:bg-blue-100 hover:text-blue-700 transition-all relative"
                                                            disabled={
                                                                actionInProgress[
                                                                    env.id || ""
                                                                ] === "merge"
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                env.id &&
                                                                    handleEnvironmentAction(
                                                                        env.id,
                                                                        "merge",
                                                                    )
                                                            }}
                                                        >
                                                            {actionInProgress[
                                                                env.id || ""
                                                            ] === "merge" ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <GitMerge className="h-3 w-3" />
                                                            )}
                                                            {actionInProgress[
                                                                env.id || ""
                                                            ] === "merge" && (
                                                                <div className="absolute inset-0 bg-blue-500/20 rounded animate-pulse" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>
                                                            {actionInProgress[
                                                                env.id || ""
                                                            ] === "merge"
                                                                ? "Merging Changes..."
                                                                : "Merge Environment Changes"}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 rounded hover:bg-purple-100 hover:text-purple-700 transition-all relative"
                                                            disabled={
                                                                actionInProgress[
                                                                    env.id || ""
                                                                ] === "checkout"
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                env.id &&
                                                                    handleEnvironmentAction(
                                                                        env.id,
                                                                        "checkout",
                                                                    )
                                                            }}
                                                        >
                                                            {actionInProgress[
                                                                env.id || ""
                                                            ] === "checkout" ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <GitBranch className="h-3 w-3" />
                                                            )}
                                                            {actionInProgress[
                                                                env.id || ""
                                                            ] ===
                                                                "checkout" && (
                                                                <div className="absolute inset-0 bg-purple-500/20 rounded animate-pulse" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>
                                                            {actionInProgress[
                                                                env.id || ""
                                                            ] === "checkout"
                                                                ? "Checking Out..."
                                                                : "Checkout Environment"}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        {/* Monitoring Actions Group (Right) */}
                                        <div className="flex items-center gap-1">
                                            <div className="flex items-center bg-muted/50 rounded-md p-1 gap-0.5">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={`h-6 w-6 p-0 relative rounded transition-all ${
                                                                    activeViews?.terminal ===
                                                                    env.id
                                                                        ? "bg-green-100 border border-green-400/60 text-green-700"
                                                                        : "hover:bg-background/80"
                                                                }`}
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation()
                                                                    env.id &&
                                                                        onViewAction(
                                                                            env.id,
                                                                            "terminal",
                                                                        )
                                                                }}
                                                            >
                                                                <Terminal className="h-3 w-3" />
                                                                {activeViews?.terminal ===
                                                                    env.id && (
                                                                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                                                )}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                Toggle Terminal
                                                                View
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={`h-6 w-6 p-0 relative rounded transition-all ${
                                                                    activeViews?.logs ===
                                                                    env.id
                                                                        ? "bg-emerald-100 border border-emerald-400/60 text-emerald-700"
                                                                        : "hover:bg-background/80"
                                                                }`}
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation()
                                                                    env.id &&
                                                                        onViewAction(
                                                                            env.id,
                                                                            "logs",
                                                                        )
                                                                }}
                                                            >
                                                                <FileText className="h-3 w-3" />
                                                                {activeViews?.logs ===
                                                                    env.id && (
                                                                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                                                )}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                Toggle Logs View
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={`h-6 w-6 p-0 relative rounded transition-all ${
                                                                    activeViews?.diff ===
                                                                    env.id
                                                                        ? "bg-teal-100 border border-teal-400/60 text-teal-700"
                                                                        : "hover:bg-background/80"
                                                                }`}
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation()
                                                                    env.id &&
                                                                        onViewAction(
                                                                            env.id,
                                                                            "diff",
                                                                        )
                                                                }}
                                                            >
                                                                <GitCompare className="h-3 w-3" />
                                                                {activeViews?.diff ===
                                                                    env.id && (
                                                                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-teal-500 rounded-full animate-pulse" />
                                                                )}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                Toggle Diff View
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>

                                            {/* Toggle All Views */}
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`h-6 w-7 p-0 relative rounded transition-all ${
                                                                activeViews?.terminal ===
                                                                    env.id &&
                                                                activeViews?.logs ===
                                                                    env.id &&
                                                                activeViews?.diff ===
                                                                    env.id
                                                                    ? "bg-gradient-to-r from-green-100 to-teal-100 border border-teal-400/60 text-teal-700"
                                                                    : "hover:bg-muted"
                                                            }`}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                if (env.id) {
                                                                    // Check if all views are active for this environment
                                                                    const allViewsActive =
                                                                        activeViews?.terminal ===
                                                                            env.id &&
                                                                        activeViews?.logs ===
                                                                            env.id &&
                                                                        activeViews?.diff ===
                                                                            env.id

                                                                    if (
                                                                        allViewsActive
                                                                    ) {
                                                                        // Close all views for this environment
                                                                        onViewAction(
                                                                            env.id,
                                                                            "terminal",
                                                                        )
                                                                        onViewAction(
                                                                            env.id,
                                                                            "logs",
                                                                        )
                                                                        onViewAction(
                                                                            env.id,
                                                                            "diff",
                                                                        )
                                                                    } else {
                                                                        // Open only the views that are not currently active
                                                                        if (
                                                                            activeViews?.terminal !==
                                                                            env.id
                                                                        ) {
                                                                            onViewAction(
                                                                                env.id,
                                                                                "terminal",
                                                                            )
                                                                        }
                                                                        if (
                                                                            activeViews?.logs !==
                                                                            env.id
                                                                        ) {
                                                                            onViewAction(
                                                                                env.id,
                                                                                "logs",
                                                                            )
                                                                        }
                                                                        if (
                                                                            activeViews?.diff !==
                                                                            env.id
                                                                        ) {
                                                                            onViewAction(
                                                                                env.id,
                                                                                "diff",
                                                                            )
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            {activeViews?.terminal ===
                                                                env.id &&
                                                            activeViews?.logs ===
                                                                env.id &&
                                                            activeViews?.diff ===
                                                                env.id ? (
                                                                <ToggleRight className="h-3 w-3" />
                                                            ) : (
                                                                <ToggleLeft className="h-3 w-3" />
                                                            )}
                                                            {activeViews?.terminal ===
                                                                env.id &&
                                                                activeViews?.logs ===
                                                                    env.id &&
                                                                activeViews?.diff ===
                                                                    env.id && (
                                                                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-full animate-pulse" />
                                                                )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>
                                                            {activeViews?.terminal ===
                                                                env.id &&
                                                            activeViews?.logs ===
                                                                env.id &&
                                                            activeViews?.diff ===
                                                                env.id
                                                                ? "Close All Monitoring Views"
                                                                : "Open All Monitoring Views"}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
