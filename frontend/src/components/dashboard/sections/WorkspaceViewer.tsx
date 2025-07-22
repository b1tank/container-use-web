import { FileIcon, FolderIcon, RefreshCcw } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FileNode {
    name: string
    type: "file" | "directory"
    children?: FileNode[]
    content?: string
}

// Mock workspace data
const mockWorkspace: FileNode = {
    name: "root",
    type: "directory",
    children: [
        {
            name: "src",
            type: "directory",
            children: [
                {
                    name: "main.go",
                    type: "file",
                    content:
                        "package main\n\nfunc main() {\n    // TODO: Implementation\n}",
                },
                {
                    name: "utils.go",
                    type: "file",
                    content: "package main\n\n// Utility functions",
                },
            ],
        },
        {
            name: "docs",
            type: "directory",
            children: [
                {
                    name: "README.md",
                    type: "file",
                    content:
                        "# Project Documentation\n\nThis is a sample project.",
                },
            ],
        },
        { name: "go.mod", type: "file", content: "module example\n\ngo 1.21" },
        {
            name: "Dockerfile",
            type: "file",
            content:
                "FROM golang:1.21\n\nWORKDIR /app\nCOPY . .\nRUN go build -o main .",
        },
    ],
}

interface FileTreeProps {
    node: FileNode
    level: number
    onFileSelect: (file: FileNode) => void
    selectedFile: FileNode | null
}

function FileTree({ node, level, onFileSelect, selectedFile }: FileTreeProps) {
    const [isExpanded, setIsExpanded] = useState(level === 0)

    const handleToggle = () => {
        if (node.type === "directory") {
            setIsExpanded(!isExpanded)
        } else {
            onFileSelect(node)
        }
    }

    return (
        <div>
            <button
                type="button"
                className={`flex items-center py-1 px-2 cursor-pointer hover:bg-muted/50 w-full text-left ${
                    selectedFile === node ? "bg-primary/10" : ""
                }`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleToggle}
            >
                {node.type === "directory" ? (
                    <FolderIcon className="w-4 h-4 mr-2 text-blue-600" />
                ) : (
                    <FileIcon className="w-4 h-4 mr-2 text-gray-600" />
                )}
                <span className="text-sm">{node.name}</span>
            </button>
            {node.type === "directory" && isExpanded && node.children && (
                <div>
                    {node.children.map((child) => (
                        <FileTree
                            key={child.name}
                            node={child}
                            level={level + 1}
                            onFileSelect={onFileSelect}
                            selectedFile={selectedFile}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function WorkspaceViewer() {
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)

    const handleRefresh = () => {
        // TODO: Implement workspace refresh
        console.log("Refreshing workspace...")
    }

    return (
        <Tabs defaultValue="explorer" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
                <TabsTrigger value="explorer">Explorer</TabsTrigger>
                <TabsTrigger value="editor">Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="explorer" className="flex-1 m-0 mt-2">
                <Card className="h-full m-4 mt-0">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Files</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRefresh}
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-auto">
                        <FileTree
                            node={mockWorkspace}
                            level={0}
                            onFileSelect={setSelectedFile}
                            selectedFile={selectedFile}
                        />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="editor" className="flex-1 m-0 mt-2">
                <Card className="h-full m-4 mt-0">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                            {selectedFile
                                ? selectedFile.name
                                : "No file selected"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 h-[calc(100%-4rem)] overflow-auto">
                        {selectedFile?.content ? (
                            <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                                {selectedFile.content}
                            </pre>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-sm text-muted-foreground">
                                    Select a file to view its contents
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
