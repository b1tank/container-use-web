import { Editor } from "@monaco-editor/react"
import { ExternalLink, FileIcon, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface FileEditorProps {
    filePath?: string
    onOpenInVSCode?: (filePath: string) => void
}

interface FileWatchMessage {
    type: "content" | "error" | "deleted"
    filePath: string
    content?: string
    error?: string
    timestamp: string
}

export function FileEditor({ filePath, onOpenInVSCode }: FileEditorProps) {
    const [content, setContent] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Get file extension for language detection
    const getLanguageFromPath = useCallback((path: string): string => {
        const extension = path.split(".").pop()?.toLowerCase()

        const languageMap: Record<string, string> = {
            ts: "typescript",
            tsx: "typescript",
            js: "javascript",
            jsx: "javascript",
            py: "python",
            json: "json",
            html: "html",
            css: "css",
            scss: "scss",
            sass: "sass",
            md: "markdown",
            yml: "yaml",
            yaml: "yaml",
            xml: "xml",
            sh: "shell",
            bash: "shell",
            sql: "sql",
            go: "go",
            rs: "rust",
            cpp: "cpp",
            c: "c",
            java: "java",
            php: "php",
            rb: "ruby",
            swift: "swift",
            kt: "kotlin",
            dart: "dart",
            r: "r",
        }

        return languageMap[extension || ""] || "plaintext"
    }, [])

    // Connect to file watching WebSocket
    const connectToFile = useCallback((path: string) => {
        if (wsRef.current) {
            wsRef.current.close()
        }

        setIsLoading(true)
        setError(null)
        setIsConnected(false)

        try {
            const wsUrl = `ws://localhost:8000/api/v1/files/watch?path=${encodeURIComponent(path)}`
            const ws = new WebSocket(wsUrl)

            ws.onopen = () => {
                console.log("File watch WebSocket connected")
                setIsConnected(true)
                setIsLoading(false)
            }

            ws.onmessage = (event) => {
                try {
                    const message: FileWatchMessage = JSON.parse(event.data)

                    switch (message.type) {
                        case "content":
                            // Show update indicator
                            setIsUpdating(true)

                            // Clear any existing timeout
                            if (updateTimeoutRef.current) {
                                clearTimeout(updateTimeoutRef.current)
                            }

                            // Update content
                            setContent(message.content || "")
                            setError(null)

                            // Hide update indicator after a short delay
                            updateTimeoutRef.current = setTimeout(() => {
                                setIsUpdating(false)
                            }, 1000)
                            break
                        case "error":
                            setError(message.error || "Unknown error")
                            setIsLoading(false)
                            setIsUpdating(false)
                            break
                        case "deleted":
                            setError("File was deleted")
                            setContent("")
                            setIsUpdating(false)
                            break
                    }
                } catch (err) {
                    console.error("Failed to parse WebSocket message:", err)
                    setError("Failed to parse file content")
                    setIsUpdating(false)
                }
            }

            ws.onclose = () => {
                console.log("File watch WebSocket disconnected")
                setIsConnected(false)
            }

            ws.onerror = (err) => {
                console.error("File watch WebSocket error:", err)
                setError("Failed to connect to file watcher")
                setIsLoading(false)
                setIsConnected(false)
            }

            wsRef.current = ws
        } catch (err) {
            console.error("Failed to create WebSocket:", err)
            setError("Failed to create WebSocket connection")
            setIsLoading(false)
        }
    }, [])

    // Handle file path changes
    useEffect(() => {
        if (filePath) {
            connectToFile(filePath)
        } else {
            if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
            }

            // Clear update timeout
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current)
                updateTimeoutRef.current = null
            }

            setContent("")
            setError(null)
            setIsConnected(false)
            setIsUpdating(false)
        }

        // Cleanup on unmount
        return () => {
            if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
            }

            // Clear update timeout
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current)
                updateTimeoutRef.current = null
            }
        }
    }, [filePath, connectToFile])

    const handleOpenInVSCode = useCallback(() => {
        if (filePath && onOpenInVSCode) {
            onOpenInVSCode(filePath)
        }
    }, [filePath, onOpenInVSCode])

    if (!filePath) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                    <div className="text-lg text-muted-foreground">📁</div>
                    <div className="text-sm text-muted-foreground">
                        Select a file to view its content
                    </div>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                    <div className="text-lg text-muted-foreground">📄</div>
                    <div className="text-sm text-muted-foreground">
                        Loading file content...
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="text-lg text-muted-foreground">❌</div>
                    <div className="text-sm text-destructive">{error}</div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => filePath && connectToFile(filePath)}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    const fileName = filePath.split("/").pop() || "Unknown File"
    const language = getLanguageFromPath(filePath)

    return (
        <div className="h-full flex flex-col">
            {/* File Header */}
            <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span
                        className="text-sm font-medium truncate"
                        title={filePath}
                    >
                        {fileName}
                    </span>
                    <div className="flex items-center gap-1">
                        <div
                            className={`w-2 h-2 rounded-full ${
                                isConnected
                                    ? "bg-green-500 animate-pulse"
                                    : "bg-gray-400"
                            }`}
                            title={
                                isConnected
                                    ? "Streaming live updates"
                                    : "Disconnected"
                            }
                        />
                        {isUpdating && (
                            <div title="Updating content...">
                                <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInVSCode}
                    className="flex items-center gap-1 text-xs h-7"
                >
                    <ExternalLink className="w-3 h-3" />
                    Edit in VS Code
                </Button>
            </div>

            {/* Editor Content */}
            <div className="flex-1 min-h-0">
                <Editor
                    height="100%"
                    language={language}
                    value={content}
                    theme="light"
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: "on",
                        lineNumbers: "on",
                        glyphMargin: false,
                        folding: true,
                        lineDecorationsWidth: 10,
                        lineNumbersMinChars: 3,
                        renderLineHighlight: "line",
                        selectOnLineNumbers: true,
                        roundedSelection: false,
                        cursorStyle: "line",
                        cursorWidth: 2,
                        fontSize: 14,
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    }}
                />
            </div>
        </div>
    )
}
