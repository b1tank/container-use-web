import { useQuery } from "@tanstack/react-query"
import { EnvironmentsService } from "@/client"

interface DiffViewerProps {
    environmentId: string | null
}

export function DiffViewer({ environmentId }: DiffViewerProps) {
    const {
        data: diff,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["diff", environmentId],
        queryFn: () =>
            environmentId
                ? EnvironmentsService.getEnvironmentDiff({ environmentId })
                : null,
        enabled: !!environmentId,
        refetchInterval: 5000, // Refresh every 5 seconds
    })

    if (!environmentId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-sm text-muted-foreground">
                    Select an environment to view diff
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-sm text-muted-foreground">
                    Loading diff...
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-sm text-destructive">
                    Failed to load diff
                </div>
            </div>
        )
    }

    return (
        <div className="h-full overflow-auto">
            <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                {typeof diff === "string"
                    ? diff
                    : diff
                      ? JSON.stringify(diff, null, 2)
                      : "No changes detected"}
            </pre>
        </div>
    )
}
