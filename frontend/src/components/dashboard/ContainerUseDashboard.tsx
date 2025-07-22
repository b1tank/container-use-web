import {
    Eye,
    FileText,
    Folder,
    GitCompare,
    Server,
    Terminal,
} from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
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
import { WatchViewer } from "./sections/WatchViewer"
import { WorkspaceViewer } from "./sections/WorkspaceViewer"

export function ContainerUseDashboard() {
    const [selectedEnvironment, setSelectedEnvironment] = useState<
        string | null
    >(null)

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
                                <Card className="h-full rounded-none border-r border-l-0 border-t-0 border-b-0">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Folder className="h-5 w-5" />
                                            Workspace
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        <WorkspaceViewer />
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
                                            {selectedEnvironment && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {selectedEnvironment}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        <TerminalViewer
                                            environmentId={selectedEnvironment}
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
                                            selectedEnvironment={
                                                selectedEnvironment
                                            }
                                            onSelectEnvironment={
                                                setSelectedEnvironment
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Watch Section */}
                            <ResizablePanel defaultSize={25} minSize={15}>
                                <Card className="h-full rounded-none border-l border-t border-r-0 border-b-0">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Eye className="h-5 w-5" />
                                            Watch
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        <WatchViewer />
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
                                            {selectedEnvironment && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {selectedEnvironment}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        <LogViewer
                                            environmentId={selectedEnvironment}
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
                                            {selectedEnvironment && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {selectedEnvironment}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-hidden">
                                        <DiffViewer
                                            environmentId={selectedEnvironment}
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
