import { FitAddon } from "@xterm/addon-fit"
import { Terminal } from "@xterm/xterm"
import { useCallback, useEffect, useRef } from "react"
import "@xterm/xterm/css/xterm.css"

interface WatchViewerProps {
    folder?: string
    cli?: string
    connected?: boolean
}

export function WatchViewer({
    folder,
    cli,
    connected = false,
}: WatchViewerProps) {
    const terminalRef = useRef<HTMLDivElement>(null)
    const terminalInstanceRef = useRef<Terminal | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)
    const websocketRef = useRef<WebSocket | null>(null)
    const resizeObserverRef = useRef<ResizeObserver | null>(null)
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Debounced resize handler to avoid excessive calls during dragging
    const handleResize = useCallback(() => {
        if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current)
        }
        resizeTimeoutRef.current = setTimeout(() => {
            if (fitAddonRef.current) {
                fitAddonRef.current.fit()
            }
        }, 100) // 100ms debounce
    }, [])

    useEffect(() => {
        if (!terminalRef.current || !connected) return

        // Create terminal instance
        const terminal = new Terminal({
            cursorBlink: true,
            theme: {
                background: "#000000",
                foreground: "#ffffff",
                cursor: "#ffffff",
                cursorAccent: "#000000",
                selectionBackground: "rgba(255, 255, 255, 0.3)",
            },
            fontSize: 12,
            fontFamily:
                '"Cascadia Code", "Fira Code", "JetBrains Mono", "SF Mono", Consolas, "Liberation Mono", Menlo, Monaco, monospace',
            allowTransparency: true,
            scrollback: 1000,
            convertEol: true, // Convert \n to \r\n
        })

        const fitAddon = new FitAddon()
        terminal.loadAddon(fitAddon)

        terminal.open(terminalRef.current)
        fitAddon.fit()

        // Store references
        terminalInstanceRef.current = terminal
        fitAddonRef.current = fitAddon

        // Connect to environment-specific WebSocket
        const connectWebSocket = () => {
            // Build WebSocket URL with query parameters
            const baseUrl = `ws://localhost:8000/api/v1/environments/watch`
            const params = new URLSearchParams()
            if (folder) params.append("folder", folder)
            if (cli) params.append("cli", cli)
            const wsUrl = params.toString()
                ? `${baseUrl}?${params.toString()}`
                : baseUrl

            try {
                const websocket = new WebSocket(wsUrl)
                websocketRef.current = websocket

                websocket.onopen = () => {
                    // Give the terminal a moment to initialize before sending resize
                    setTimeout(() => {
                        if (fitAddonRef.current) {
                            fitAddonRef.current.fit()
                            const dimensions =
                                fitAddonRef.current.proposeDimensions()
                            if (
                                dimensions &&
                                websocket.readyState === WebSocket.OPEN
                            ) {
                                websocket.send(
                                    JSON.stringify({
                                        type: "resize",
                                        cols: dimensions.cols,
                                        rows: dimensions.rows,
                                    }),
                                )
                            }
                        }
                    }, 100)
                }

                websocket.onmessage = (event) => {
                    // Write data directly to terminal
                    terminal.write(event.data)
                }

                websocket.onclose = (event) => {
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
                    websocketRef.current = null
                    terminal.writeln(
                        `\r\n\x1b[31mWebSocket error occurred\x1b[0m\r\n`,
                    )
                }
            } catch (error) {
                terminal.writeln(
                    `\r\n\x1b[31mFailed to connect: ${error instanceof Error ? error.message : "Unknown error"}\x1b[0m\r\n`,
                )
            }
        }

        // Handle terminal input
        terminal.onData((data) => {
            if (
                websocketRef.current &&
                websocketRef.current.readyState === WebSocket.OPEN
            ) {
                websocketRef.current.send(data)
            }
        })

        // Set up ResizeObserver to watch for container size changes
        if (terminalRef.current) {
            const resizeObserver = new ResizeObserver(() => {
                handleResize()
            })
            resizeObserver.observe(terminalRef.current)
            resizeObserverRef.current = resizeObserver
        }

        // Also listen to window resize events as fallback
        window.addEventListener("resize", handleResize)

        // Handle terminal resize events
        terminal.onResize(({ cols, rows }) => {
            if (
                websocketRef.current &&
                websocketRef.current.readyState === WebSocket.OPEN
            ) {
                // Send resize message to backend
                websocketRef.current.send(
                    JSON.stringify({
                        type: "resize",
                        cols,
                        rows,
                    }),
                )
            }
        })

        // Connect to WebSocket
        connectWebSocket()

        return () => {
            // Clean up resize timeout
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current)
            }

            // Clean up ResizeObserver
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect()
                resizeObserverRef.current = null
            }

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
    }, [folder, cli, connected, handleResize])

    return (
        <div className="h-full flex flex-col">
            {/* Terminal Content */}
            <div className="flex-1 bg-black relative">
                {connected ? (
                    <div ref={terminalRef} className="h-full" />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-2">
                            <div className="text-lg text-muted-foreground">
                                Terminal not connected
                            </div>
                            <div className="text-sm text-muted-foreground/70">
                                Use the Connect button to start the watch
                                terminal
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
