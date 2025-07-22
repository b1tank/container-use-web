import { FitAddon } from "@xterm/addon-fit"
import { Terminal } from "@xterm/xterm"
import { useEffect, useRef } from "react"
import "@xterm/xterm/css/xterm.css"

interface TerminalViewerProps {
    environmentId: string | null
}

export function TerminalViewer({ environmentId }: TerminalViewerProps) {
    const terminalRef = useRef<HTMLDivElement>(null)
    const terminalInstanceRef = useRef<Terminal | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)

    useEffect(() => {
        if (!terminalRef.current || !environmentId) return

        // Create terminal instance
        const terminal = new Terminal({
            theme: {
                background: "#000000",
                foreground: "#ffffff",
            },
            fontSize: 12,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        })

        const fitAddon = new FitAddon()
        terminal.loadAddon(fitAddon)

        terminal.open(terminalRef.current)
        fitAddon.fit()

        // Store references
        terminalInstanceRef.current = terminal
        fitAddonRef.current = fitAddon

        // Simulate terminal connection
        terminal.writeln(
            `Connecting to terminal for environment: ${environmentId}`,
        )
        terminal.writeln("This is a placeholder terminal implementation.")
        terminal.writeln(
            "TODO: Implement WebSocket connection to container-use terminal command.",
        )
        terminal.write("$ ")

        // Handle resize
        const handleResize = () => {
            fitAddon.fit()
        }
        window.addEventListener("resize", handleResize)

        return () => {
            terminal.dispose()
            window.removeEventListener("resize", handleResize)
            terminalInstanceRef.current = null
            fitAddonRef.current = null
        }
    }, [environmentId])

    if (!environmentId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-sm text-muted-foreground">
                    Select an environment to open terminal
                </div>
            </div>
        )
    }

    return (
        <div className="h-full bg-black">
            <div ref={terminalRef} className="h-full" />
        </div>
    )
}
