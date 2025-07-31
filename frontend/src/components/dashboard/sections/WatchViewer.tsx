import { FitAddon } from "@xterm/addon-fit"
import { Terminal } from "@xterm/xterm"
import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react"
import "@xterm/xterm/css/xterm.css"

interface WatchViewerProps {
    folder?: string
    cli?: string
    onStatusChange?: (
        status: "disconnected" | "connecting" | "connected" | "error",
        isWatching: boolean,
    ) => void
}

export interface WatchViewerRef {
    toggleConnection: () => void
    isWatching: boolean
    connectionStatus: "disconnected" | "connecting" | "connected" | "error"
}

export const WatchViewer = forwardRef<WatchViewerRef, WatchViewerProps>(
    ({ folder, cli, onStatusChange }, ref) => {
        const terminalRef = useRef<HTMLDivElement>(null)
        const terminalInstanceRef = useRef<Terminal | null>(null)
        const fitAddonRef = useRef<FitAddon | null>(null)
        const websocketRef = useRef<WebSocket | null>(null)
        const [connectionStatus, setConnectionStatus] = useState<
            "disconnected" | "connecting" | "connected" | "error"
        >("disconnected")
        const [isWatching, setIsWatching] = useState(false)

        // Notify parent of status changes
        useEffect(() => {
            onStatusChange?.(connectionStatus, isWatching)
        }, [connectionStatus, isWatching, onStatusChange])

        useEffect(() => {
            if (!terminalRef.current) return

            // Create terminal instance
            const terminal = new Terminal({
                cursorBlink: false, // Watch mode is read-only, no cursor needed
                theme: {
                    background: "#000000",
                    foreground: "#ffffff",
                    cursor: "#ffffff",
                },
                fontSize: 12,
                fontFamily:
                    '"Cascadia Code", "Fira Code", "JetBrains Mono", "SF Mono", Consolas, "Liberation Mono", Menlo, Monaco, monospace',
            })

            const fitAddon = new FitAddon()
            terminal.loadAddon(fitAddon)

            terminal.open(terminalRef.current)
            fitAddon.fit()

            // Store references
            terminalInstanceRef.current = terminal
            fitAddonRef.current = fitAddon

            // Handle resize
            const handleResize = () => {
                fitAddon.fit()
            }
            window.addEventListener("resize", handleResize)

            return () => {
                // Clean up WebSocket connection
                if (websocketRef.current) {
                    websocketRef.current.close(1000, "Component unmounting")
                    websocketRef.current = null
                }

                terminal.dispose()
                window.removeEventListener("resize", handleResize)
                terminalInstanceRef.current = null
                fitAddonRef.current = null
            }
        }, [])

        const connectWebSocket = useCallback(() => {
            if (
                !terminalInstanceRef.current ||
                websocketRef.current?.readyState === WebSocket.OPEN
            )
                return

            setConnectionStatus("connecting")
            setIsWatching(true)

            // Build WebSocket URL with query parameters
            const baseUrl = `ws://localhost:8000/api/v1/watch`
            const params = new URLSearchParams()
            if (folder) params.append("folder", folder)
            if (cli) params.append("cli", cli)
            const wsUrl = params.toString()
                ? `${baseUrl}?${params.toString()}`
                : baseUrl

            try {
                const websocket = new WebSocket(wsUrl)
                websocketRef.current = websocket
                const terminal = terminalInstanceRef.current

                websocket.onopen = () => {
                    setConnectionStatus("connected")
                    terminal.writeln(
                        "\r\n\x1b[32mConnected to watch mode!\x1b[0m",
                    )
                }

                websocket.onmessage = (event) => {
                    // Write data directly to terminal
                    terminal.write(event.data)
                }

                websocket.onclose = (event) => {
                    setConnectionStatus("disconnected")
                    setIsWatching(false)
                    websocketRef.current = null

                    if (event.code !== 1000) {
                        terminal.writeln(
                            `\r\n\x1b[31mConnection closed: ${event.code} ${event.reason}\x1b[0m\r\n`,
                        )
                    } else {
                        terminal.writeln(
                            "\r\n\x1b[33mConnection closed normally\x1b[0m\r\n",
                        )
                    }
                }

                websocket.onerror = () => {
                    setConnectionStatus("error")
                    setIsWatching(false)
                    websocketRef.current = null
                    terminal.writeln(
                        `\r\n\x1b[31mWebSocket error occurred\x1b[0m\r\n`,
                    )
                }
            } catch (error) {
                setConnectionStatus("error")
                setIsWatching(false)
                terminalInstanceRef.current?.writeln(
                    `\r\n\x1b[31mFailed to connect: ${error instanceof Error ? error.message : "Unknown error"}\x1b[0m\r\n`,
                )
            }
        }, [folder, cli])

        const disconnectWebSocket = useCallback(() => {
            if (websocketRef.current) {
                websocketRef.current.close(1000, "User disconnected")
                websocketRef.current = null
            }
            setConnectionStatus("disconnected")
            setIsWatching(false)
        }, [])

        const handleToggleConnection = useCallback(() => {
            if (isWatching) {
                disconnectWebSocket()
            } else {
                connectWebSocket()
            }
        }, [isWatching, connectWebSocket, disconnectWebSocket])

        // Expose methods to parent component
        useImperativeHandle(
            ref,
            () => ({
                toggleConnection: handleToggleConnection,
                isWatching,
                connectionStatus,
            }),
            [handleToggleConnection, isWatching, connectionStatus],
        )

        // Show simple text message when not watching
        if (!isWatching && connectionStatus === "disconnected") {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-sm text-muted-foreground">
                        Click "Connect" to start watching environment activity
                    </div>
                </div>
            )
        }

        return (
            <div className="h-full bg-black relative">
                <div ref={terminalRef} className="h-full" />
            </div>
        )
    },
)
