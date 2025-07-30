import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { ContainerUseDashboard } from "@/components/dashboard/ContainerUseDashboard"

const searchSchema = z.object({
    folder: z.string().optional(),
    cli: z.string().optional(),
})

export const Route = createFileRoute("/")({
    validateSearch: searchSchema,
    component: Index,
})

function Index() {
    const { folder, cli } = Route.useSearch()
    return <ContainerUseDashboard folder={folder} cli={cli} />
}
