import {
    ArrowUp,
    ChevronRight,
    FileIcon,
    FolderIcon,
    Home,
    Loader2,
    RefreshCcw,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { DefaultService, type GetApiV1FilesResponse } from "@/client"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

interface FileEntry {
    name: string
    path: string
    type: "file" | "folder"
    size?: number
    modified?: string
}

interface FileTreeProps {
    entry: FileEntry
    level: number
    onFolderClick: (path: string) => void
    currentFolder?: string
}

function FileTree({
    entry,
    level,
    onFolderClick,
    currentFolder,
}: FileTreeProps) {
    const isSelected = currentFolder === entry.path

    const handleClick = () => {
        if (entry.type === "folder") {
            onFolderClick(entry.path)
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
            {entry.type === "folder" ? (
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
            {entry.type === "file" && entry.size !== undefined && (
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
    const [currentFolder, setCurrentFolder] = useState<string>(
        initialFolder || "",
    )
    const [currentFolderData, setCurrentFolderData] =
        useState<GetApiV1FilesResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false) // Start with loading state
    const [error, setError] = useState<string | null>(null)

    const fetchFolderData = useCallback(async (folder?: string) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await DefaultService.getApiV1Files({
                path: folder,
            })
            setCurrentFolderData(response)
            setCurrentFolder(response.path)
        } catch (err) {
            console.error("Failed to fetch folder:", err)
            setError(
                "Failed to load folder. Please check the path and try again.",
            )
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Fetch initial folder data when component mounts
    useEffect(() => {
        fetchFolderData(initialFolder)
    }, [initialFolder, fetchFolderData])

    const handleGoHome = () => {
        fetchFolderData(initialFolder)
    }

    const handleGoToParent = () => {
        if (currentFolder) {
            const parentFolder = currentFolder.split("/").slice(0, -1).join("/")
            // If parentFolder is empty, it means we're going to root
            fetchFolderData(parentFolder || "/")
        }
    }

    const handleRefresh = () => {
        if (currentFolder) {
            fetchFolderData(currentFolder)
        } else {
            fetchFolderData(initialFolder)
        }
    }

    const handleFolderClick = (folder: string) => {
        if (folder !== currentFolder) {
            fetchFolderData(folder)
        }
    }

    const pathSegments = useMemo(
        () => currentFolder.split("/").filter(Boolean),
        [currentFolder],
    )

    // Special case: if we're at root ("/"), show it as a segment
    const isAtRoot = currentFolder === "/"
    const displaySegments = useMemo(
        () => (isAtRoot ? ["/"] : pathSegments),
        [isAtRoot, pathSegments],
    )

    // Simple and reliable path construction for breadcrumbs - memoized to prevent unnecessary recalculations
    const constructBreadcrumbPath = useMemo(() => {
        return (segmentIndex: number) => {
            // Special handling for root directory
            if (isAtRoot && segmentIndex === 0) {
                return "/"
            }

            // Split current path and rebuild up to the target segment
            const allParts = currentFolder.split("/")

            // Find where our pathSegments start in the full path
            // Work backwards to find the matching sequence
            let startIdx = -1
            for (let i = allParts.length - pathSegments.length; i >= 0; i--) {
                let matches = true
                for (let j = 0; j < pathSegments.length; j++) {
                    if (allParts[i + j] !== pathSegments[j]) {
                        matches = false
                        break
                    }
                }
                if (matches) {
                    startIdx = i
                    break
                }
            }

            if (startIdx === -1) {
                // Fallback: just use the segments we have
                const targetSegments = pathSegments.slice(0, segmentIndex + 1)
                return `/${targetSegments.join("/")}`
            }

            // Build path up to the target segment
            const endIdx = startIdx + segmentIndex + 1
            const targetParts = allParts.slice(0, endIdx)
            const result = targetParts.join("/") || "/"

            return result
        }
    }, [currentFolder, pathSegments, isAtRoot])

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
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleGoHome}
                                        disabled={isLoading}
                                        title="Go to home folder"
                                        className="h-7 w-7 p-0"
                                    >
                                        <Home className="w-3 h-3" />
                                    </Button>
                                    {currentFolderData?.parent && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleGoToParent}
                                            disabled={isLoading}
                                            title="Go to parent folder"
                                            className="h-7 w-7 p-0"
                                        >
                                            <ArrowUp className="w-3 h-3" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRefresh}
                                        disabled={isLoading}
                                        title="Refresh folder"
                                        className="h-7 w-7 p-0"
                                    >
                                        <RefreshCcw
                                            className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
                                        />
                                    </Button>
                                </div>
                            </div>

                            {/* Breadcrumb Navigation */}
                            <div className="mt-2">
                                <Breadcrumb>
                                    <BreadcrumbList className="gap-0 sm:gap-1">
                                        <BreadcrumbItem>
                                            <BreadcrumbLink
                                                className="flex items-center gap-1 cursor-pointer hover:text-foreground hover:shadow-sm transition-shadow duration-200 rounded px-1 py-0.5"
                                                onClick={handleGoHome}
                                            >
                                                <Home className="w-3.5 h-3.5" />
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        {displaySegments.flatMap(
                                            (segment, index) => {
                                                const isLast =
                                                    index ===
                                                    displaySegments.length - 1
                                                const absolutePath =
                                                    constructBreadcrumbPath(
                                                        index,
                                                    )

                                                const elements = [
                                                    <BreadcrumbItem
                                                        key={`item-${absolutePath}`}
                                                    >
                                                        {isLast ? (
                                                            <BreadcrumbPage className="max-w-32 truncate">
                                                                {segment}
                                                            </BreadcrumbPage>
                                                        ) : (
                                                            <BreadcrumbLink
                                                                className="max-w-32 truncate cursor-pointer hover:text-foreground hover:shadow-sm transition-shadow duration-200 rounded px-1 py-0.5"
                                                                onClick={() =>
                                                                    handleFolderClick(
                                                                        absolutePath,
                                                                    )
                                                                }
                                                            >
                                                                {segment}
                                                            </BreadcrumbLink>
                                                        )}
                                                    </BreadcrumbItem>,
                                                ]

                                                if (!isLast) {
                                                    elements.push(
                                                        <BreadcrumbSeparator
                                                            key={`sep-${absolutePath}`}
                                                        >
                                                            /
                                                        </BreadcrumbSeparator>,
                                                    )
                                                }

                                                return elements
                                            },
                                        )}
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                        </div>

                        {/* Explorer Content */}
                        <div className="flex-1 overflow-auto">
                            {isLoading && (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin mr-2 inline-block" />
                                        Loading folder contents...
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

                            {currentFolderData && !isLoading && !error && (
                                <div className="space-y-0">
                                    {currentFolderData.items
                                        .sort((a, b) => {
                                            // Sort directories first, then files
                                            if (a.type !== b.type) {
                                                return a.type === "folder"
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
                                                onFolderClick={
                                                    handleFolderClick
                                                }
                                                currentFolder={currentFolder}
                                            />
                                        ))}

                                    {currentFolderData.items.length === 0 && (
                                        <div className="p-4 text-center">
                                            <div className="text-sm text-muted-foreground">
                                                This folder is empty
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
