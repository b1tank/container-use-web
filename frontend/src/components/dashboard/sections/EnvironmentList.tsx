import { useQuery } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"
import { DefaultService, type Environment } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface EnvironmentListProps {
    selectedEnvironment: string | null
    onSelectEnvironment: (id: string) => void
    folder?: string
    cli?: string
}

export function EnvironmentList({
    selectedEnvironment,
    onSelectEnvironment,
    folder,
    cli,
}: EnvironmentListProps) {
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
        refetchInterval: (query) => {
            // Only auto-refresh if there's no error
            return query.state.error ? false : 5000
        },
        retry: false, // Disable automatic retries to prevent error blinking
        refetchOnWindowFocus: false, // Prevent unnecessary refetches
    })

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
                    <div className="text-2xl">📁</div>
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
                                    Current Settings:
                                </div>
                                {folder && <div>📂 Folder: {folder}</div>}
                                {cli && <div>🛠️ CLI: {cli}</div>}
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={() => refetch()}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                    >
                        <RefreshCw
                            className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`}
                        />
                        {isLoading ? "Checking..." : "Check Again"}
                    </Button>
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
        <div className="h-full overflow-auto">
            <div className="space-y-2 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            Environments ({environments?.length || 0})
                        </h3>
                        {(folder || cli) && (
                            <div className="text-xs text-muted-foreground/70 space-x-2">
                                {folder && <span>📂 {folder}</span>}
                                {cli && <span>🛠️ {cli}</span>}
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={() => refetch()}
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        className="h-6 w-6 p-0"
                    >
                        <RefreshCw
                            className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
                        />
                    </Button>
                </div>
                {environments.map((env: Environment) => (
                    <Card
                        key={env.id}
                        className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                            selectedEnvironment === env.id
                                ? "ring-2 ring-primary bg-primary/5"
                                : "hover:bg-muted/50"
                        }`}
                        onClick={() => env.id && onSelectEnvironment(env.id)}
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm truncate">
                                    {env.title || "Untitled Environment"}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                    {env.id || "No ID"}
                                </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div>Created: {env.created || "Unknown"}</div>
                                <div>Updated: {env.updated || "Unknown"}</div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
