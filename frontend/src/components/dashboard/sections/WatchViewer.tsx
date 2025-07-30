import { useEffect, useState } from "react"

export function WatchViewer() {
    const [watchData, setWatchData] = useState<string[]>([])
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        // TODO: Implement WebSocket connection for real-time watch updates
        // For now, simulate some activity
        const interval = setInterval(() => {
            const timestamp = new Date().toLocaleTimeString()
            setWatchData((prev) => [
                ...prev.slice(-49),
                `${timestamp}: Environment activity detected`,
            ])
        }, 3000)

        setIsConnected(true)

        return () => {
            clearInterval(interval)
            setIsConnected(false)
        }
    }, [])

    return (
        <div className="h-full flex flex-col">
            {/* Status Header */}
            <div className="px-3 py-2 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                        Real-time Activity
                    </span>
                    <div
                        className={`text-xs px-2 py-1 rounded ${
                            isConnected
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                        }`}
                    >
                        {isConnected ? "Connected" : "Disconnected"}
                    </div>
                </div>
            </div>

            {/* Watch Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-4 space-y-1">
                    {watchData.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                            Waiting for activity...
                        </div>
                    ) : (
                        watchData.map((line) => (
                            <div key={line} className="text-xs font-mono">
                                {line}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
