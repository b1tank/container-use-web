import { useQuery } from "@tanstack/react-query"
import { RefreshCw, RotateCcw } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { DefaultService } from "@/client"
import { Button } from "@/components/ui/button"

interface LogViewerProps {
    environmentId: string | null
    folder?: string
    cli?: string
}

export function LogViewer({ environmentId, folder, cli }: LogViewerProps) {
    const [autoRefresh, setAutoRefresh] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const {
        data: logData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["environmentLogs", environmentId, folder, cli],
        queryFn: () => {
            if (!environmentId) throw new Error("Environment ID is required")
            return DefaultService.getApiV1EnvironmentsByIdLogs({
                id: environmentId,
                ...(folder && { folder }),
                ...(cli && { cli }),
            })
        },
        enabled: !!environmentId,
        refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds when auto-refresh is enabled
        retry: false,
        refetchOnWindowFocus: false,
    })

    const handleManualRefresh = () => {
        refetch()
    }

    const toggleAutoRefresh = () => {
        setAutoRefresh((prev) => !prev)
    }

    // Auto-scroll to bottom when new data arrives
    useEffect(() => {
        if (logData && containerRef.current) {
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTop =
                        containerRef.current.scrollHeight
                }
            }, 0)
        }
    }, [logData])

    if (!environmentId) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                    <div className="text-2xl text-muted-foreground">📋</div>
                    <div className="text-sm text-muted-foreground">
                        No Environment Selected
                    </div>
                    <div className="text-xs text-muted-foreground/70">
                        Select an environment to view logs
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
                    {logData && (
                        <div className="text-xs text-muted-foreground">
                            Last updated:{" "}
                            {new Date(logData.timestamp).toLocaleTimeString()}
                            {autoRefresh && " (auto-refresh enabled)"}
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

            {/* Log Content */}
            <div className="flex-1 overflow-auto" ref={containerRef}>
                <div className="p-4">
                    {error ? (
                        <div className="text-sm text-red-600">
                            Error: {error.message}
                        </div>
                    ) : isLoading && !logData ? (
                        <div className="text-sm text-muted-foreground">
                            Loading logs...
                        </div>
                    ) : logData ? (
                        <div className="space-y-1">
                            {logData.logs
                                .split("\n")
                                .map((line: string, index: number) => (
                                    <div
                                        key={`log-${index}-${line.substring(0, 20)}`}
                                        className="text-xs font-mono whitespace-pre-wrap"
                                    >
                                        {line}
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            No logs available
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
