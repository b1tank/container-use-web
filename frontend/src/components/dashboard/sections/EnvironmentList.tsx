import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type Environment, EnvironmentsService } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface EnvironmentListProps {
    selectedEnvironment: string | null
    onSelectEnvironment: (id: string) => void
}

export function EnvironmentList({
    selectedEnvironment,
    onSelectEnvironment,
}: EnvironmentListProps) {
    const queryClient = useQueryClient()

    const {
        data: environments,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["environments"],
        queryFn: () => EnvironmentsService.listEnvironments(),
        refetchInterval: 5000, // Refresh every 5 seconds
    })

    const actionMutation = useMutation({
        mutationFn: ({
            action,
            environmentId,
        }: {
            action: string
            environmentId: string
        }) =>
            EnvironmentsService.executeAction({
                requestBody: {
                    action,
                    environment_id: environmentId,
                },
            }),
        onSuccess: () => {
            // Invalidate and refetch environments to get updated data
            queryClient.invalidateQueries({ queryKey: ["environments"] })
        },
        onError: (error) => {
            console.error("Action failed:", error)
            // TODO: Show user-friendly error message
        },
    })

    const handleContextAction = (action: string, environmentId: string) => {
        actionMutation.mutate({ action, environmentId })
    }

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
            <div className="flex items-center justify-center h-full">
                <div className="text-sm text-destructive">
                    Failed to load environments
                </div>
            </div>
        )
    }

    if (!environments?.length) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-sm text-muted-foreground">
                    No environments found
                </div>
            </div>
        )
    }

    return (
        <div className="h-full overflow-auto">
            <div className="space-y-2 p-4">
                {environments.map((env: Environment) => (
                    <ContextMenu key={env.id}>
                        <ContextMenuTrigger>
                            <Card
                                className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                                    selectedEnvironment === env.id
                                        ? "ring-2 ring-primary bg-primary/5"
                                        : "hover:bg-muted/50"
                                }`}
                                onClick={() =>
                                    env.id && onSelectEnvironment(env.id)
                                }
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-sm truncate">
                                            {env.title ||
                                                "Untitled Environment"}
                                        </h4>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {env.id || "No ID"}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div>
                                            Created: {env.created || "Unknown"}
                                        </div>
                                        <div>
                                            Updated: {env.updated || "Unknown"}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem
                                onClick={() =>
                                    env.id &&
                                    handleContextAction("apply", env.id)
                                }
                                disabled={!env.id || actionMutation.isPending}
                            >
                                Apply Changes
                            </ContextMenuItem>
                            <ContextMenuItem
                                onClick={() =>
                                    env.id &&
                                    handleContextAction("checkout", env.id)
                                }
                                disabled={!env.id || actionMutation.isPending}
                            >
                                Checkout Branch
                            </ContextMenuItem>
                            <ContextMenuItem
                                onClick={() =>
                                    env.id &&
                                    handleContextAction("merge", env.id)
                                }
                                disabled={!env.id || actionMutation.isPending}
                            >
                                Merge Changes
                            </ContextMenuItem>
                            <ContextMenuItem
                                onClick={() =>
                                    env.id &&
                                    handleContextAction("terminal", env.id)
                                }
                                disabled={!env.id || actionMutation.isPending}
                            >
                                Open Terminal
                            </ContextMenuItem>
                            <ContextMenuItem
                                onClick={() =>
                                    env.id &&
                                    handleContextAction("delete", env.id)
                                }
                                disabled={!env.id || actionMutation.isPending}
                                className="text-destructive"
                            >
                                Delete Environment
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                ))}
            </div>
        </div>
    )
}
