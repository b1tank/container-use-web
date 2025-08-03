import { useQuery } from "@tanstack/react-query"
import {
    FileText,
    GitCompare,
    RefreshCw,
    RotateCcw,
    Terminal,
    ToggleLeft,
    ToggleRight,
} from "lucide-react"
import { useEffect, useState } from "react"
import { DefaultService, type Environment } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type ViewType = "terminal" | "logs" | "diff"

interface ActiveViews {
    terminal: string | null
    logs: string | null
    diff: string | null
}

interface EnvironmentViewerProps {
    onViewAction: (environmentId: string, viewType: ViewType) => void
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
    folder,
    cli,
    activeViews,
    onEnvironmentStatusChange,
}: EnvironmentViewerProps) {
    const [autoRefresh, setAutoRefresh] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    const {
        data: environments,
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
        if (environments && !isLoading) {
            setLastUpdated(new Date())
        }
    }, [environments, isLoading])

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
                    <div className="text-2xl">🌎</div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">
                            No Environments Found
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Please select a folder that contains a git
                            repository to view and manage your container
                            environments.
                        </p>
                        {(folder || cli) && (
                            <div className="text-xs bg-muted/50 p-2 rounded border space-y-1">
                                <div className="font-medium">
                                    Current Folder:
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

    if (!environments?.length) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="text-2xl">🛠️</div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">
                            Ready to Get Started
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            No environments found in this repository yet. Create
                            your first environment to begin containerized
                            development.
                        </p>
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
                        <Badge
                            variant="secondary"
                            className="text-xs h-6 w-6 rounded-full flex items-center justify-center p-0 bg-emerald-50 border-emerald-200 text-emerald-700 font-medium"
                        >
                            {environments?.length || 0}
                        </Badge>
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
                                    <Badge
                                        variant="outline"
                                        className={`text-xs font-mono px-2 py-0.5 transition-all ${
                                            activeViews?.terminal === env.id ||
                                            activeViews?.logs === env.id ||
                                            activeViews?.diff === env.id
                                                ? "bg-gradient-to-r from-green-100 to-teal-100 border-green-400/70 text-green-800 shadow-md"
                                                : ""
                                        }`}
                                    >
                                        {env.id || "No ID"}
                                    </Badge>
                                </div>
                                {/* Created/Updated info and Action Icons on same row */}
                                <div className="flex items-end justify-between">
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div>
                                            Created: {env.created || "Unknown"}
                                        </div>
                                        <div>
                                            Updated: {env.updated || "Unknown"}
                                        </div>
                                    </div>
                                    {/* Action Icons */}
                                    <div className="flex gap-1 items-center">
                                        {/* Individual action buttons */}
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-6 w-6 p-0 relative transition-all ${
                                                    activeViews?.terminal ===
                                                    env.id
                                                        ? "border border-green-400/60 hover:bg-primary/10"
                                                        : "hover:bg-primary/10"
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    env.id &&
                                                        onViewAction(
                                                            env.id,
                                                            "terminal",
                                                        )
                                                }}
                                                title="Open Terminal"
                                            >
                                                <Terminal
                                                    className={`h-3 w-3 transition-colors ${activeViews?.terminal === env.id ? "text-green-600" : ""}`}
                                                />
                                                {activeViews?.terminal ===
                                                    env.id && (
                                                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-6 w-6 p-0 relative transition-all ${
                                                    activeViews?.logs === env.id
                                                        ? "border border-emerald-400/60 hover:bg-primary/10"
                                                        : "hover:bg-primary/10"
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    env.id &&
                                                        onViewAction(
                                                            env.id,
                                                            "logs",
                                                        )
                                                }}
                                                title="Open Logs"
                                            >
                                                <FileText
                                                    className={`h-3 w-3 transition-colors ${activeViews?.logs === env.id ? "text-emerald-600" : ""}`}
                                                />
                                                {activeViews?.logs ===
                                                    env.id && (
                                                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-6 w-6 p-0 relative transition-all ${
                                                    activeViews?.diff === env.id
                                                        ? "border border-teal-400/60 hover:bg-primary/10"
                                                        : "hover:bg-primary/10"
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    env.id &&
                                                        onViewAction(
                                                            env.id,
                                                            "diff",
                                                        )
                                                }}
                                                title="Open Diff"
                                            >
                                                <GitCompare
                                                    className={`h-3 w-3 transition-colors ${activeViews?.diff === env.id ? "text-teal-600" : ""}`}
                                                />
                                                {activeViews?.diff ===
                                                    env.id && (
                                                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-teal-500 rounded-full animate-pulse" />
                                                )}
                                            </Button>
                                        </div>

                                        {/* Separator */}
                                        <div className="w-px h-4 bg-border mx-1" />

                                        {/* Toggle All button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`h-6 w-8 p-0 relative transition-all ${
                                                activeViews?.terminal ===
                                                    env.id &&
                                                activeViews?.logs === env.id &&
                                                activeViews?.diff === env.id
                                                    ? "border border-teal-400/60 hover:bg-primary/10"
                                                    : "hover:bg-primary/10"
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

                                                    if (allViewsActive) {
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
                                            title={
                                                activeViews?.terminal ===
                                                    env.id &&
                                                activeViews?.logs === env.id &&
                                                activeViews?.diff === env.id
                                                    ? "Close All Views"
                                                    : "Open All Views"
                                            }
                                        >
                                            {activeViews?.terminal === env.id &&
                                            activeViews?.logs === env.id &&
                                            activeViews?.diff === env.id ? (
                                                <ToggleRight className="h-3 w-3 text-teal-600" />
                                            ) : (
                                                <ToggleLeft className="h-3 w-3" />
                                            )}
                                            {activeViews?.terminal === env.id &&
                                                activeViews?.logs === env.id &&
                                                activeViews?.diff ===
                                                    env.id && (
                                                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-full animate-pulse" />
                                                )}
                                        </Button>
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
