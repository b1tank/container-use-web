import { useQuery } from "@tanstack/react-query"
import {
    AlertCircle,
    Check,
    GitMerge,
    RefreshCw,
    RotateCcw,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { DefaultService, type GetApiV1GitResponse } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type GitBranchType = GetApiV1GitResponse["data"]["branches"][number]

interface GitViewerProps {
    folder?: string
}

export function GitViewer({ folder }: GitViewerProps) {
    const [autoRefresh, setAutoRefresh] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [checkingOut, setCheckingOut] = useState<string | null>(null)

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

    if (!branches?.length) {
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
                        <Badge
                            variant="secondary"
                            className="text-xs h-6 w-6 rounded-full flex items-center justify-center p-0 bg-blue-50 border-blue-200 text-blue-700 font-medium"
                        >
                            {branches?.length || 0}
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
                {folder && (
                    <div className="text-xs text-muted-foreground mt-1 space-x-2">
                        <span>📂 {folder}</span>
                        {gitStatus && (
                            <>
                                <span>🌿 {gitStatus.currentBranch}</span>
                                {gitStatus.hasUncommittedChanges && (
                                    <span className="text-orange-600">
                                        ⚡ uncommitted changes
                                    </span>
                                )}
                            </>
                        )}
                        {autoRefresh && <span>(auto-refresh enabled)</span>}
                    </div>
                )}
            </div>

            {/* Branch List Content */}
            <div className="flex-1 overflow-auto">
                <div className="space-y-2 p-4">
                    {branches.map((branch: GitBranchType) => (
                        <Card
                            key={branch.name}
                            className={`p-3 transition-all hover:shadow-md hover:bg-muted/50 ${
                                branch.current
                                    ? "bg-blue-50/50 border-blue-200"
                                    : ""
                            }`}
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm truncate">
                                            {branch.name}
                                        </h4>
                                        {branch.current && (
                                            <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {branch.current && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs font-mono px-2 py-0.5 bg-green-100 border-green-400/70 text-green-800"
                                            >
                                                CURRENT
                                            </Badge>
                                        )}
                                        {branch.remote && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                remote
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Branch info and Action Icons on same row */}
                                <div className="flex items-end justify-between">
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        {branch.upstream && (
                                            <div>
                                                Upstream: {branch.upstream}
                                            </div>
                                        )}
                                        {(branch.ahead || branch.behind) && (
                                            <div className="flex gap-2">
                                                {branch.ahead && (
                                                    <span className="text-green-600">
                                                        +{branch.ahead} ahead
                                                    </span>
                                                )}
                                                {branch.behind && (
                                                    <span className="text-red-600">
                                                        -{branch.behind} behind
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Icons */}
                                    <div className="flex gap-1 items-center">
                                        {/* Checkout action button - only for non-current, non-remote branches */}
                                        {!branch.current && !branch.remote && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-6 w-6 p-0 relative transition-all hover:bg-primary/10 ${
                                                    gitStatus?.hasUncommittedChanges
                                                        ? "opacity-50"
                                                        : ""
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleCheckout(branch.name)
                                                }}
                                                disabled={
                                                    checkingOut ===
                                                        branch.name ||
                                                    gitStatus?.hasUncommittedChanges
                                                }
                                                title={
                                                    gitStatus?.hasUncommittedChanges
                                                        ? "Cannot checkout - uncommitted changes"
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
                                            <div className="h-6 w-6 flex items-center justify-center">
                                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                </div>
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
