import { FitAddon } from "@xterm/addon-fit"
import { Terminal } from "@xterm/xterm"
import { useEffect, useRef } from "react"
import "@xterm/xterm/css/xterm.css"

interface WatchViewerProps {
    folder?: string
    cli?: string
}

export function WatchViewer({ folder, cli }: WatchViewerProps) {
    const terminalRef = useRef<HTMLDivElement>(null)
    const terminalInstanceRef = useRef<Terminal | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)
    const websocketRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        if (!terminalRef.current) return

        // Create terminal instance
        const terminal = new Terminal({
            cursorBlink: true,
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
                    terminal.writeln(
                        "\r\n\x1b[32mConnected to environment terminal!\x1b[0m",
                    )
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

        // Handle resize
        const handleResize = () => {
            fitAddon.fit()
        }
        window.addEventListener("resize", handleResize)

        // Connect to WebSocket
        connectWebSocket()

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
    }, [folder, cli])

    return (
        <div className="h-full flex flex-col">
            {/* Terminal Content */}
            <div className="flex-1 bg-black relative">
                <div ref={terminalRef} className="h-full" />
            </div>
        </div>
    )
}
