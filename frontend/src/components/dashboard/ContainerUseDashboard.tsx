import {
    Eye,
    FileText,
    Folder,
    GitCompare,
    Plug,
    PlugZap,
    Server,
    Terminal,
} from "lucide-react"
import { useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import { DiffViewer } from "./sections/DiffViewer"
import { EnvironmentList } from "./sections/EnvironmentList"
import { LogViewer } from "./sections/LogViewer"
import { TerminalViewer } from "./sections/TerminalViewer"
import { WatchViewer, type WatchViewerRef } from "./sections/WatchViewer"
import { WorkspaceViewer } from "./sections/WorkspaceViewer"

interface ContainerUseDashboardProps {
    folder?: string
    cli?: string
}

type ViewType = "terminal" | "logs" | "diff"

interface ActiveViews {
    terminal: string | null
    logs: string | null
    diff: string | null
}

export function ContainerUseDashboard({
    folder,
    cli,
}: ContainerUseDashboardProps) {
    const watchViewerRef = useRef<WatchViewerRef>(null)
    const [watchStatus, setWatchStatus] = useState<{
        status: "disconnected" | "connecting" | "connected" | "error"
        isWatching: boolean
    }>({
        status: "disconnected",
        isWatching: false,
    })

    const [activeViews, setActiveViews] = useState<ActiveViews>({
        terminal: null,
        logs: null,
        diff: null,
    })

    const handleViewAction = (environmentId: string, viewType: ViewType) => {
        setActiveViews((prev) => ({
            ...prev,
            [viewType]: prev[viewType] === environmentId ? null : environmentId,
        }))
    }

    const handleWatchStatusChange = (
        status: "disconnected" | "connecting" | "connected" | "error",
        isWatching: boolean,
    ) => {
        setWatchStatus({ status, isWatching })
    }

    const handleToggleWatch = () => {
        watchViewerRef.current?.toggleConnection()
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Main horizontal layout: Left (3/4) + Right (1/4) */}
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* Left Section (3/4) - Workspace + Terminal */}
                    <ResizablePanel defaultSize={75} minSize={60} maxSize={85}>
                        <ResizablePanelGroup
                            direction="vertical"
                            className="h-full"
                        >
                            {/* Top: Workspace */}
                            <ResizablePanel defaultSize={50} minSize={30}>
                                <Card className="h-full rounded-none border-r-0 border-l-0 border-t-0 border-b-0">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Folder className="h-5 w-5" />
                                            Workspace
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-2rem)] overflow-hidden">
                                        <WorkspaceViewer
                                            initialFolder={folder}
                                        />
                                    </CardContent>
                                </Card>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Bottom: Terminal */}
                            <ResizablePanel defaultSize={50} minSize={30}>
                                <Card className="h-full rounded-none border-t border-l-0 border-r-0 border-b-0">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Terminal className="h-5 w-5" />
                                                Terminal
                                            </div>
                                            {activeViews.terminal && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {activeViews.terminal}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        <TerminalViewer
                                            environmentId={activeViews.terminal}
                                            folder={folder}
                                            cli={cli}
                                        />
                                    </CardContent>
                                </Card>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Right Section (1/4) - Environment + Watch + Log + Diff */}
                    <ResizablePanel defaultSize={25} minSize={25} maxSize={40}>
                        <ResizablePanelGroup
                            direction="vertical"
                            className="h-full"
                        >
                            {/* Environment Section */}
                            <ResizablePanel defaultSize={25} minSize={15}>
                                <Card className="h-full rounded-none border-l border-r-0 border-t-0 border-b-0">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Server className="h-5 w-5" />
                                            Environments
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        <EnvironmentList
                                            onViewAction={handleViewAction}
                                            folder={folder}
                                            cli={cli}
                                        />
                                    </CardContent>
                                </Card>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Watch Section */}
                            <ResizablePanel defaultSize={25} minSize={15}>
                                <Card className="h-full rounded-none border-l border-t border-r-0 border-b-0">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-5 w-5" />
                                                Watch
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={handleToggleWatch}
                                                    size="sm"
                                                    variant={
                                                        watchStatus.isWatching
                                                            ? "destructive"
                                                            : "default"
                                                    }
                                                    className="h-6 px-2 text-xs"
                                                >
                                                    {watchStatus.isWatching ? (
                                                        <PlugZap className="h-3 w-3" />
                                                    ) : (
                                                        <Plug className="h-3 w-3" />
                                                    )}
                                                </Button>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${
                                                        watchStatus.status ===
                                                        "connected"
                                                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                                                            : watchStatus.status ===
                                                                "connecting"
                                                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                              : watchStatus.status ===
                                                                  "error"
                                                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                                                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                                    }`}
                                                >
                                                    {watchStatus.status ===
                                                        "connected" && "🟢"}
                                                    {watchStatus.status ===
                                                        "connecting" && "🟡"}
                                                    {watchStatus.status ===
                                                        "error" && "🔴"}
                                                    {watchStatus.status ===
                                                        "disconnected" && "⚫"}
                                                </Badge>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        <WatchViewer
                                            ref={watchViewerRef}
                                            folder={folder}
                                            cli={cli}
                                            onStatusChange={
                                                handleWatchStatusChange
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Log Section */}
                            <ResizablePanel defaultSize={25} minSize={15}>
                                <Card className="h-full rounded-none border-l border-t border-r-0 border-b-0">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                Logs
                                            </div>
                                            {activeViews.logs && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {activeViews.logs}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        <LogViewer
                                            environmentId={activeViews.logs}
                                            folder={folder}
                                            cli={cli}
                                        />
                                    </CardContent>
                                </Card>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Diff Section */}
                            <ResizablePanel defaultSize={25} minSize={15}>
                                <Card className="h-full rounded-none border-l border-t border-r-0 border-b-0">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GitCompare className="h-5 w-5" />
                                                Diff
                                            </div>
                                            {activeViews.diff && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {activeViews.diff}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        <DiffViewer
                                            environmentId={activeViews.diff}
                                            folder={folder}
                                            cli={cli}
                                        />
                                    </CardContent>
                                </Card>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}
