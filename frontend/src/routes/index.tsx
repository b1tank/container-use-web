import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { ContainerUseDashboard } from "@/components/dashboard/ContainerUseDashboard"

const searchSchema = z.object({
    folder: z.string().optional(),
    cli: z.string().optional(),
})

// Custom search param serialization to prevent escaping of forward slashes in folder paths
const searchParamOptions = {
    stringifySearch: (search: Record<string, string | undefined>) => {
        const searchParams = new URLSearchParams()

        // Handle folder parameter without escaping forward slashes
        if (search.folder) {
            searchParams.set("folder", search.folder)
        }

        // Handle other parameters normally
        if (search.cli) {
            searchParams.set("cli", search.cli)
        }

        const queryString = searchParams.toString()

        // Manually unescape forward slashes in the folder parameter
        return queryString.replace(/folder=([^&]*)/g, (_match, value) => {
            return `folder=${decodeURIComponent(value)}`
        })
    },
    parseSearch: (searchString: string) => {
        const searchParams = new URLSearchParams(searchString)
        const result: Record<string, string> = {}

        // Parse folder parameter (already unescaped from URL)
        const folder = searchParams.get("folder")
        if (folder) {
            result.folder = folder
        }

        // Parse other parameters
        const cli = searchParams.get("cli")
        if (cli) {
            result.cli = cli
        }

        return result
    },
}

export const Route = createFileRoute("/")({
    validateSearch: searchSchema,
    ...searchParamOptions,
    component: Index,
})

function Index() {
    const { folder, cli } = Route.useSearch()
    return <ContainerUseDashboard folder={folder} cli={cli} />
}
