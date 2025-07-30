import {
    ArrowUp,
    ChevronRight,
    FileIcon,
    FolderIcon,
    Home,
    RefreshCcw,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { DefaultService, type GetApiV1FilesResponse } from "@/client"
import { Button } from "@/components/ui/button"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

interface FileEntry {
    name: string
    path: string
    type: "file" | "directory"
    size?: number
    modified?: string
}

interface FileTreeProps {
    entry: FileEntry
    level: number
    onDirectoryClick: (path: string) => void
    selectedPath?: string
}

function FileTree({
    entry,
    level,
    onDirectoryClick,
    selectedPath,
}: FileTreeProps) {
    const isSelected = selectedPath === entry.path

    const handleClick = () => {
        if (entry.type === "directory") {
            onDirectoryClick(entry.path)
        }
    }

    return (
        <button
            type="button"
            className={`flex items-center py-2 px-2 cursor-pointer hover:bg-muted/50 w-full text-left transition-colors ${
                isSelected ? "bg-primary/10 border-r-2 border-primary" : ""
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={handleClick}
        >
            {entry.type === "directory" ? (
                <>
                    <ChevronRight className="w-3 h-3 mr-1 text-muted-foreground" />
                    <FolderIcon className="w-4 h-4 mr-2 text-blue-500" />
                </>
            ) : (
                <>
                    <div className="w-4 mr-1" /> {/* Spacer for alignment */}
                    <FileIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                </>
            )}
            <span className="text-sm flex-1">{entry.name}</span>
            {entry.type === "file" && entry.size && (
                <span className="text-xs text-muted-foreground ml-2">
                    {formatFileSize(entry.size)}
                </span>
            )}
        </button>
    )
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

export function WorkspaceViewer({ initialFolder }: { initialFolder?: string }) {
    const [currentPath, setCurrentPath] = useState<string>("")
    const [directoryData, setDirectoryData] =
        useState<GetApiV1FilesResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPath, setSelectedPath] = useState<string>()

    const fetchDirectory = useCallback(async (path?: string) => {
        setLoading(true)
        setError(null)

        try {
            const response = await DefaultService.getApiV1Files({ path })
            setDirectoryData(response)
            setCurrentPath(response.path)
        } catch (err) {
            console.error("Failed to fetch directory:", err)
            setError(
                "Failed to load directory. Please check the path and try again.",
            )
        } finally {
            setLoading(false)
        }
    }, [])

    // Load initial folder or home directory on mount
    useEffect(() => {
        fetchDirectory(initialFolder)
    }, [fetchDirectory, initialFolder])

    const handleRefresh = () => {
        fetchDirectory(currentPath)
    }

    const handleDirectoryClick = (path: string) => {
        setSelectedPath(path)
        fetchDirectory(path)
    }

    const handleGoToParent = () => {
        if (directoryData?.parent) {
            handleDirectoryClick(directoryData.parent)
        }
    }

    const handleGoHome = () => {
        setSelectedPath(undefined)
        fetchDirectory() // This will fetch the default home directory
    }

    const pathSegments = currentPath.split("/").filter(Boolean)

    return (
        <div className="h-full">
            <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* File Explorer Panel */}
                <ResizablePanel defaultSize={35} minSize={25} maxSize={60}>
                    <div className="h-full flex flex-col border-r">
                        {/* Explorer Header */}
                        <div className="px-3 py-2 border-b bg-muted/30">
                            <div className="flex items-center justify-between min-w-0">
                                <div className="flex items-center min-w-0 flex-1">
                                    <span className="text-sm font-semibold truncate">
                                        Explorer
                                    </span>
                                    {initialFolder && (
                                        <span className="text-xs text-muted-foreground ml-2 truncate hidden sm:inline">
                                            (starting from: {initialFolder})
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleGoHome}
                                        disabled={loading}
                                        title="Go to home directory"
                                        className="h-7 w-7 p-0"
                                    >
                                        <Home className="w-3 h-3" />
                                    </Button>
                                    {directoryData?.parent && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleGoToParent}
                                            disabled={loading}
                                            title="Go to parent directory"
                                            className="h-7 w-7 p-0"
                                        >
                                            <ArrowUp className="w-3 h-3" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRefresh}
                                        disabled={loading}
                                        title="Refresh directory"
                                        className="h-7 w-7 p-0"
                                    >
                                        <RefreshCcw
                                            className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                                        />
                                    </Button>
                                </div>
                            </div>

                            {/* Breadcrumb */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2 overflow-hidden">
                                <Home className="w-3 h-3 flex-shrink-0" />
                                {pathSegments.map((segment, index) => {
                                    const cumulativePath = pathSegments
                                        .slice(0, index + 1)
                                        .join("/")
                                    return (
                                        <div
                                            key={cumulativePath}
                                            className="flex items-center gap-1 min-w-0"
                                        >
                                            <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">
                                                {segment}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Explorer Content */}
                        <div className="flex-1 overflow-auto">
                            {loading && (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-sm text-muted-foreground">
                                        Loading...
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4">
                                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded border">
                                        {error}
                                    </div>
                                </div>
                            )}

                            {directoryData && !loading && !error && (
                                <div className="space-y-0">
                                    {directoryData.items
                                        .sort((a, b) => {
                                            // Sort directories first, then files
                                            if (a.type !== b.type) {
                                                return a.type === "directory"
                                                    ? -1
                                                    : 1
                                            }
                                            return a.name.localeCompare(b.name)
                                        })
                                        .map((entry) => (
                                            <FileTree
                                                key={entry.path}
                                                entry={entry}
                                                level={0}
                                                onDirectoryClick={
                                                    handleDirectoryClick
                                                }
                                                selectedPath={selectedPath}
                                            />
                                        ))}

                                    {directoryData.items.length === 0 && (
                                        <div className="p-4 text-center">
                                            <div className="text-sm text-muted-foreground">
                                                This directory is empty
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Editor Panel */}
                <ResizablePanel defaultSize={65} minSize={40}>
                    <div className="h-full flex flex-col">
                        {/* Editor Header */}
                        <div className="px-3 py-2 border-b bg-muted/30">
                            <span className="text-sm font-semibold">
                                Editor
                            </span>
                        </div>

                        {/* Editor Content */}
                        <div className="flex-1 overflow-auto">
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center space-y-2">
                                    <div className="text-lg text-muted-foreground">
                                        📝
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Editor not implemented yet
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Monaco editor will be integrated here
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}
