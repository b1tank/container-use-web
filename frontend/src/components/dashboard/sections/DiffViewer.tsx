interface DiffViewerProps {
    environmentId: string | null
}

export function DiffViewer({ environmentId }: DiffViewerProps) {
    // TODO: Implement diff functionality once API is available
    // The current SDK doesn't have a getEnvironmentDiff endpoint

    if (!environmentId) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-sm text-muted-foreground">
                    Select an environment to view diff
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">
                    Diff functionality not yet implemented
                </div>
                <div className="text-xs text-muted-foreground">
                    Environment: {environmentId}
                </div>
            </div>
        </div>
    )
}
