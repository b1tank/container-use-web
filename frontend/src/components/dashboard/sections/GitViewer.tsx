import { useQuery } from "@tanstack/react-query"
import {
    AlertCircle,
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    GitBranch,
    GitMerge,
    History,
    Link2,
    RefreshCw,
    RotateCcw,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import {
    DefaultService,
    type GetApiV1GitLogResponse,
    type GetApiV1GitResponse,
} from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type GitBranchType = GetApiV1GitResponse["data"]["branches"][number]

interface GitViewerProps {
    folder?: string
}

export function GitViewer({ folder }: GitViewerProps) {
    const [autoRefresh, setAutoRefresh] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [checkingOut, setCheckingOut] = useState<string | null>(null)
    const [gitLogData, setGitLogData] = useState<
        Record<string, GetApiV1GitLogResponse["data"] | null>
    >({})
    const [loadingLog, setLoadingLog] = useState<Record<string, boolean>>({})
    const [showLogTooltip, setShowLogTooltip] = useState<string | null>(null)

    const {
        data: gitResponse,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["git", folder], // Include folder in query key for proper caching
        queryFn: () =>
            DefaultService.getApiV1Git({
                folder: folder || "",
            }),
        retry: false, // Disable automatic retries to prevent error blinking
        refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds when auto-refresh is enabled
        refetchOnWindowFocus: false,
        enabled: !!folder, // Only run query if folder is provided
    })

    const gitStatus = gitResponse?.success ? gitResponse.data : null
    const branches = gitStatus?.branches || []

    // Sort branches: current first, then local branches alphabetically, then remote branches
    const sortedBranches = [...branches].sort((a, b) => {
        // Current branch always first
        if (a.current && !b.current) return -1
        if (!a.current && b.current) return 1

        // Local branches before remote branches
        if (!a.remote && b.remote) return -1
        if (a.remote && !b.remote) return 1

        // Within same type, sort alphabetically
        return a.name.localeCompare(b.name)
    })

    const handleManualRefresh = () => {
        refetch()
    }

    const toggleAutoRefresh = () => {
        setAutoRefresh((prev) => !prev)
    }

    const handleCheckout = useCallback(
        async (branch: string) => {
            if (!folder || checkingOut) return

            setCheckingOut(branch)

            try {
                const response = await DefaultService.postApiV1GitCheckout({
                    folder,
                    requestBody: { branch },
                })

                if (response.success) {
                    // Refresh git status after successful checkout
                    await refetch()
                }
            } catch (err) {
                console.error("Failed to checkout branch:", err)
            } finally {
                setCheckingOut(null)
            }
        },
        [folder, checkingOut, refetch],
    )

    const handleShowLog = useCallback(
        async (branch: string) => {
            if (!folder || loadingLog[branch]) return

            // If already loaded, just toggle the tooltip
            if (gitLogData[branch]) {
                setShowLogTooltip(showLogTooltip === branch ? null : branch)
                return
            }

            setLoadingLog((prev) => ({ ...prev, [branch]: true }))

            try {
                const response = await DefaultService.getApiV1GitLog({
                    folder,
                    branch,
                    limit: "10",
                })

                if (response.success) {
                    setGitLogData((prev) => ({
                        ...prev,
                        [branch]: response.data,
                    }))
                    setShowLogTooltip(branch)
                }
            } catch (err) {
                console.error("Failed to get git log:", err)
            } finally {
                setLoadingLog((prev) => ({ ...prev, [branch]: false }))
            }
        },
        [folder, loadingLog, gitLogData, showLogTooltip],
    )

    // Update last updated timestamp when git data changes
    useEffect(() => {
        if (gitResponse && !isLoading) {
            setLastUpdated(new Date())
        }
    }, [gitResponse, isLoading])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-sm text-muted-foreground">
                    Loading git status...
                </div>
            </div>
        )
    }

    if (error || !gitStatus?.isRepository) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="text-2xl">🌳</div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">
                            Not a Git Repository
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            The selected folder is not a git repository or git
                            is not initialized.
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

    if (!sortedBranches?.length) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="text-2xl">🔀</div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">
                            No Branches Found
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This git repository doesn't have any branches yet.
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
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant="secondary"
                                    className="text-xs h-6 w-6 rounded-full flex items-center justify-center p-0 bg-blue-50 border-blue-200 text-blue-700 font-medium"
                                >
                                    {sortedBranches?.length || 0}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={4}>
                                <div className="text-xs space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400">
                                            ●
                                        </span>
                                        <span>
                                            {
                                                sortedBranches.filter(
                                                    (b) => !b.remote,
                                                ).length
                                            }{" "}
                                            local branches
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-400">●</span>
                                        <span>
                                            {
                                                sortedBranches.filter(
                                                    (b) => b.remote,
                                                ).length
                                            }{" "}
                                            remote branches
                                        </span>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
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
                {folder && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <span>📂 {folder}</span>
                        {gitStatus && (
                            <>
                                <Badge
                                    variant="outline"
                                    className="text-xs px-1.5 py-0 h-5 border-green-300 text-green-700 bg-green-50 flex items-center gap-1"
                                >
                                    <GitBranch className="h-3 w-3" />
                                    {gitStatus.currentBranch}
                                </Badge>
                                {gitStatus.hasUncommittedChanges && (
                                    <Badge
                                        variant="outline"
                                        className="text-xs px-1.5 py-0 h-5 border-orange-300 text-orange-700 bg-orange-50"
                                    >
                                        ⚡ uncommitted changes
                                    </Badge>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Branch List Content */}
            <div className="flex-1 overflow-auto">
                <div className="space-y-2 p-4">
                    {sortedBranches.map((branch: GitBranchType) => (
                        <Card
                            key={branch.name}
                            className={`p-4 transition-all hover:shadow-md hover:bg-muted/50 ${
                                branch.current
                                    ? "bg-blue-50/50 border-blue-200 shadow-sm"
                                    : branch.trackingStatus === "gone"
                                      ? "bg-red-50/30 border-red-200"
                                      : ""
                            }`}
                        >
                            <div className="space-y-2">
                                {/* Main branch info line */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Branch icon and name */}
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <GitBranch
                                                className={`h-4 w-4 flex-shrink-0 ${
                                                    branch.current
                                                        ? "text-green-600"
                                                        : branch.remote
                                                          ? "text-blue-500"
                                                          : "text-muted-foreground"
                                                }`}
                                            />
                                            <h4
                                                className={`font-medium text-sm truncate ${
                                                    branch.current
                                                        ? "text-green-700 font-semibold"
                                                        : branch.remote
                                                          ? "text-blue-600"
                                                          : "text-foreground"
                                                }`}
                                            >
                                                {branch.remote
                                                    ? branch.name
                                                          .split("/")
                                                          .slice(-1)[0] // Show only the branch name part
                                                    : branch.name}
                                            </h4>
                                        </div>

                                        {/* Branch type badges */}
                                        <div className="flex items-center gap-1">
                                            {branch.remote && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs px-1.5 py-0 h-5 border-blue-300 text-blue-700 bg-blue-50"
                                                >
                                                    {branch.name.includes("/")
                                                        ? `remote: ${branch.name.split("/")[0]}` // Show "remote: container-use"
                                                        : "remote"}
                                                </Badge>
                                            )}
                                            {branch.trackingStatus ===
                                                "gone" && (
                                                <Badge
                                                    variant="destructive"
                                                    className="text-xs px-1.5 py-0 h-5 bg-red-100 text-red-700 border-red-300"
                                                >
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    gone
                                                </Badge>
                                            )}
                                            {branch.current && (
                                                <Badge
                                                    variant="default"
                                                    className="text-xs px-1.5 py-0 h-5 bg-green-100 text-green-700 border-green-300"
                                                >
                                                    current
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Icons */}
                                    <div className="flex gap-1 items-center">
                                        {/* Git Log action button - for all branches */}
                                        <Tooltip
                                            open={
                                                showLogTooltip === branch.name
                                            }
                                        >
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 relative transition-all hover:bg-primary/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleShowLog(
                                                            branch.name,
                                                        )
                                                    }}
                                                    disabled={
                                                        loadingLog[branch.name]
                                                    }
                                                    title="View Git Log"
                                                >
                                                    {loadingLog[branch.name] ? (
                                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <History className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="left"
                                                sideOffset={8}
                                                className="max-w-md p-0 border shadow-lg"
                                                onPointerDownOutside={() =>
                                                    setShowLogTooltip(null)
                                                }
                                            >
                                                {gitLogData[branch.name] && (
                                                    <div className="bg-background border rounded-lg shadow-lg overflow-hidden">
                                                        <div className="px-3 py-2 bg-muted/50 border-b">
                                                            <div className="flex items-center gap-2">
                                                                <History className="h-4 w-4 text-muted-foreground" />
                                                                <span className="font-medium text-sm">
                                                                    Git Log:{" "}
                                                                    {
                                                                        gitLogData[
                                                                            branch
                                                                                .name
                                                                        ]
                                                                            ?.branch
                                                                    }
                                                                </span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 ml-auto"
                                                                    onClick={() =>
                                                                        setShowLogTooltip(
                                                                            null,
                                                                        )
                                                                    }
                                                                >
                                                                    ✕
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="max-h-80 overflow-y-auto">
                                                            {gitLogData[
                                                                branch.name
                                                            ]?.commits
                                                                ?.length ===
                                                            0 ? (
                                                                <div className="p-4 text-center text-muted-foreground text-sm">
                                                                    No commits
                                                                    found
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-0">
                                                                    {gitLogData[
                                                                        branch
                                                                            .name
                                                                    ]?.commits?.map(
                                                                        (
                                                                            commit,
                                                                            index,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    commit.hash
                                                                                }
                                                                                className={`p-3 border-b last:border-b-0 hover:bg-muted/30 ${
                                                                                    index %
                                                                                        2 ===
                                                                                    0
                                                                                        ? "bg-background"
                                                                                        : "bg-muted/20"
                                                                                }`}
                                                                            >
                                                                                <div className="space-y-1">
                                                                                    <div className="flex items-start gap-2">
                                                                                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground border">
                                                                                            {
                                                                                                commit.hash
                                                                                            }
                                                                                        </code>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <div className="text-sm font-medium text-foreground truncate">
                                                                                                {
                                                                                                    commit.message
                                                                                                }
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                                                                <span>
                                                                                                    {
                                                                                                        commit.author
                                                                                                    }
                                                                                                </span>
                                                                                                <span>
                                                                                                    •
                                                                                                </span>
                                                                                                <span>
                                                                                                    {
                                                                                                        commit.relative
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </TooltipContent>
                                        </Tooltip>

                                        {/* Checkout action button - for non-current branches */}
                                        {!branch.current && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-7 w-7 p-0 relative transition-all hover:bg-primary/10 ${
                                                    gitStatus?.hasUncommittedChanges
                                                        ? "opacity-50"
                                                        : ""
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    // For remote branches, pass the full remote path (e.g., "container-use/social-tapir")
                                                    // For local branches, pass just the branch name
                                                    const branchToCheckout =
                                                        branch.remote
                                                            ? branch.name
                                                            : branch.name
                                                    handleCheckout(
                                                        branchToCheckout,
                                                    )
                                                }}
                                                disabled={
                                                    checkingOut ===
                                                        branch.name ||
                                                    gitStatus?.hasUncommittedChanges
                                                }
                                                title={
                                                    gitStatus?.hasUncommittedChanges
                                                        ? "Cannot checkout - uncommitted changes"
                                                        : branch.remote
                                                          ? "Create local tracking branch and checkout"
                                                          : "Checkout Branch"
                                                }
                                            >
                                                {checkingOut === branch.name ? (
                                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <GitMerge className="h-3 w-3" />
                                                )}
                                            </Button>
                                        )}

                                        {/* Current branch indicator */}
                                        {branch.current && (
                                            <div className="h-7 w-7 flex items-center justify-center">
                                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Commit info line */}
                                {(branch.commitHash ||
                                    branch.commitMessage) && (
                                    <div className="flex items-start gap-2 text-xs">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {branch.commitHash && (
                                                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground border">
                                                    {branch.commitHash}
                                                </code>
                                            )}
                                            {branch.commitMessage && (
                                                <span
                                                    className="text-muted-foreground truncate flex-1"
                                                    title={branch.commitMessage} // Show full message on hover
                                                >
                                                    {branch.commitMessage}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Tracking info line */}
                                {(branch.upstream ||
                                    branch.trackingStatus ||
                                    branch.ahead ||
                                    branch.behind) && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            {branch.upstream &&
                                                !branch.remote && (
                                                    <div className="flex items-center gap-1">
                                                        <div className="text-gray-500 flex items-center">
                                                            <Link2 className="h-3 w-3" />
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs px-1.5 py-0 h-5 border-blue-300 text-blue-700 bg-blue-50 flex items-center gap-1"
                                                        >
                                                            <GitBranch className="h-3 w-3" />
                                                            {branch.upstream}
                                                        </Badge>
                                                    </div>
                                                )}
                                            {branch.trackingStatus &&
                                                branch.trackingStatus !==
                                                    "gone" && (
                                                    <span className="text-blue-600 font-medium">
                                                        [{branch.trackingStatus}
                                                        ]
                                                    </span>
                                                )}
                                            {(branch.ahead ||
                                                branch.behind) && (
                                                <div className="flex items-center gap-1">
                                                    {branch.ahead && (
                                                        <span className="flex items-center gap-1 text-green-600 font-medium">
                                                            <ArrowUp className="h-3 w-3" />
                                                            {branch.ahead}
                                                        </span>
                                                    )}
                                                    {branch.behind && (
                                                        <span className="flex items-center gap-1 text-red-600 font-medium">
                                                            <ArrowDown className="h-3 w-3" />
                                                            {branch.behind}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Warning for uncommitted changes */}
                {gitStatus?.hasUncommittedChanges && (
                    <div className="mx-4 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-yellow-700">
                                <p className="font-medium">
                                    Uncommitted Changes
                                </p>
                                <p>
                                    You have uncommitted changes. Commit or
                                    stash them before switching branches.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
