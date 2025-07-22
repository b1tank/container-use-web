import { useQuery } from "@tanstack/react-query"
import { EnvironmentsService } from "@/client"

interface LogViewerProps {
    environmentId: string | null
}

export function LogViewer({ environmentId }: LogViewerProps) {
    const {
        data: logs,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["logs", environmentId],
        queryFn: () =>
            environmentId
                ? EnvironmentsService.getEnvironmentLogs({ environmentId })
                : null,
        enabled: !!environmentId,
        refetchInterval: 2000, // Refresh every 2 seconds
    })

    if (!environmentId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-sm text-muted-foreground">
                    Select an environment to view logs
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-sm text-muted-foreground">
                    Loading logs...
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-sm text-destructive">
                    Failed to load logs
                </div>
            </div>
        )
    }

    return (
        <div className="h-full overflow-auto">
            <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                {typeof logs === "string"
                    ? logs
                    : logs
                      ? JSON.stringify(logs, null, 2)
                      : "No logs available"}
            </pre>
        </div>
    )
}
