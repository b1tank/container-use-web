import { useQuery } from "@tanstack/react-query"
import { RefreshCw, RotateCcw } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { DefaultService } from "@/client"
import { Button } from "@/components/ui/button"

interface DiffViewerProps {
    environmentId: string | null
    folder?: string
    cli?: string
}

export function DiffViewer({ environmentId, folder, cli }: DiffViewerProps) {
    const [autoRefresh, setAutoRefresh] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const {
        data: diffData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["environmentDiff", environmentId, folder, cli],
        queryFn: () => {
            if (!environmentId) throw new Error("Environment ID is required")
            return DefaultService.getApiV1EnvironmentsByIdDiff({
                id: environmentId,
                ...(folder && { folder }),
                ...(cli && { cli }),
            })
        },
        enabled: !!environmentId,
        refetchInterval: autoRefresh ? 60000 : false, // Refresh every 60 seconds when auto-refresh is enabled (longer interval for diff)
        retry: false,
        refetchOnWindowFocus: false,
    })

    const handleManualRefresh = () => {
        refetch()
    }

    const toggleAutoRefresh = () => {
        setAutoRefresh((prev) => !prev)
    }

    // Auto-scroll to top when new data arrives (for diff viewing)
    useEffect(() => {
        if (diffData && containerRef.current) {
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTop = 0
                }
            }, 0)
        }
    }, [diffData])

    // Helper function to format diff lines with colors
    const formatDiffLine = (line: string, index: number) => {
        let className = "text-xs font-mono whitespace-pre-wrap px-2 py-0.5"

        if (line.startsWith("+") && !line.startsWith("+++")) {
            className +=
                " text-green-700 bg-green-50 border-l-2 border-green-300"
        } else if (line.startsWith("-") && !line.startsWith("---")) {
            className += " text-red-700 bg-red-50 border-l-2 border-red-300"
        } else if (line.startsWith("@@")) {
            className +=
                " text-blue-700 bg-blue-50 font-semibold border-l-2 border-blue-300"
        } else if (
            line.startsWith("diff --git") ||
            line.startsWith("index ") ||
            line.startsWith("+++") ||
            line.startsWith("---")
        ) {
            className += " text-gray-600 font-semibold bg-gray-50"
        } else {
            className += " text-gray-800"
        }

        return (
            <div
                key={`diff-${index}-${line.substring(0, 20)}`}
                className={className}
            >
                {line}
            </div>
        )
    }

    if (!environmentId) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                    <div className="text-2xl text-muted-foreground">🔍</div>
                    <div className="text-sm text-muted-foreground">
                        No Environment Selected
                    </div>
                    <div className="text-xs text-muted-foreground/70">
                        Select an environment to view diffs
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
                    {diffData && (
                        <div className="text-xs text-muted-foreground">
                            Last updated:{" "}
                            {new Date(diffData.timestamp).toLocaleTimeString()}
                            {autoRefresh && " (auto-refresh every 60s)"}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
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
            </div>

            {/* Diff Content */}
            <div className="flex-1 overflow-auto" ref={containerRef}>
                <div className="p-4">
                    {error ? (
                        <div className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded">
                            <strong>Error:</strong> {error.message}
                        </div>
                    ) : isLoading && !diffData ? (
                        <div className="text-sm text-muted-foreground flex items-center justify-center h-20">
                            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                            Loading diff...
                        </div>
                    ) : diffData ? (
                        <div className="border rounded-md bg-white overflow-hidden">
                            {diffData.diff.trim() === "" ? (
                                <div className="p-4 text-sm text-muted-foreground text-center bg-gray-50">
                                    No changes detected
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {diffData.diff
                                        .split("\n")
                                        .map((line: string, index: number) =>
                                            formatDiffLine(line, index),
                                        )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground text-center h-20 flex items-center justify-center">
                            No diff available
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
