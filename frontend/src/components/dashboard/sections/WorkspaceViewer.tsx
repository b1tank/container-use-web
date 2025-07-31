import { useSearch } from "@tanstack/react-router"
import {
    ArrowUp,
    ChevronRight,
    FileIcon,
    FolderIcon,
    Home,
    Loader2,
    RefreshCcw,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
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
    const searchParams = useSearch({ from: "/" })

    const [currentPath, setCurrentPath] = useState<string>("")
    const [directoryData, setDirectoryData] =
        useState<GetApiV1FilesResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPath, setSelectedPath] = useState<string>()

    // Function to update URL with new folder (preserving unescaped slashes)
    const updateUrlFolder = useCallback((folderPath?: string) => {
        const url = new URL(window.location.href)

        if (folderPath) {
            url.searchParams.set("folder", folderPath)
        } else {
            url.searchParams.delete("folder")
        }

        // Replace encoded slashes with unescaped ones for better readability
        const updatedUrl = url.toString().replace(/%2F/g, "/")

        // Use replaceState to avoid cluttering browser history
        window.history.replaceState(null, "", updatedUrl)
    }, [])

    const fetchDirectory = useCallback(
        async (path?: string, updateUrl = true) => {
            console.log("Fetching directory:", path)
            setLoading(true)
            setError(null)

            try {
                const response = await DefaultService.getApiV1Files({ path })
                console.log("API response:", response)
                setDirectoryData(response)
                setCurrentPath(response.path)

                // Update URL if requested (default true)
                if (updateUrl) {
                    updateUrlFolder(response.path)
                }
            } catch (err) {
                console.error("Failed to fetch directory:", err)
                setError(
                    "Failed to load directory. Please check the path and try again.",
                )
            } finally {
                setLoading(false)
            }
        },
        [updateUrlFolder],
    )

    // Load initial folder from URL or prop on mount
    useEffect(() => {
        // Priority: URL folder parameter > initialFolder prop > home directory
        const targetFolder = searchParams.folder || initialFolder
        // Don't update URL if we're already loading from URL parameter
        const shouldUpdateUrl = !searchParams.folder && !!initialFolder
        fetchDirectory(targetFolder, shouldUpdateUrl)
    }, [fetchDirectory, initialFolder, searchParams.folder])

    // Sync with URL folder parameter changes (when user navigates via URL/back button)
    useEffect(() => {
        // Only sync if the URL folder differs from current path
        if (searchParams.folder && searchParams.folder !== currentPath) {
            fetchDirectory(searchParams.folder, false) // Don't update URL since it's already set
        } else if (!searchParams.folder && currentPath) {
            // If URL has no folder but we have a current path, go to home
            fetchDirectory(undefined, false)
        }
    }, [searchParams.folder, currentPath, fetchDirectory])

    const handleRefresh = () => {
        fetchDirectory(currentPath, false) // Don't update URL on refresh
    }

    const handleDirectoryClick = (path: string) => {
        console.log("Directory click - navigating to:", path)
        setSelectedPath(path)
        fetchDirectory(path) // This will update URL
    }

    const handleGoToParent = () => {
        if (directoryData?.parent) {
            handleDirectoryClick(directoryData.parent)
        }
    }

    const handleGoHome = () => {
        setSelectedPath(undefined)
        fetchDirectory() // This will fetch home directory and update URL
    }

    const pathSegments = currentPath.split("/").filter(Boolean)

    // Simple and reliable path construction for breadcrumbs
    const constructBreadcrumbPath = (segmentIndex: number) => {
        // Split current path and rebuild up to the target segment
        const allParts = currentPath.split("/")

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
            return "/" + targetSegments.join("/")
        }

        // Build path up to the target segment
        const endIdx = startIdx + segmentIndex + 1
        const targetParts = allParts.slice(0, endIdx)
        const result = targetParts.join("/") || "/"

        console.log("Breadcrumb path construction:", {
            currentPath,
            pathSegments,
            segmentIndex,
            startIdx,
            endIdx,
            targetParts,
            result,
        })

        return result
    }

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
                                        {pathSegments.flatMap(
                                            (segment, index) => {
                                                const isLast =
                                                    index ===
                                                    pathSegments.length - 1
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
                                                                    handleDirectoryClick(
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
                            {loading && (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin mr-2 inline-block" />
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
