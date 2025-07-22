import { createFileRoute } from "@tanstack/react-router"
import { ContainerUseDashboard } from "@/components/dashboard/ContainerUseDashboard"

export const Route = createFileRoute("/")({
    component: Index,
})

function Index() {
    return <ContainerUseDashboard />
}
