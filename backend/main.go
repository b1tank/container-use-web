package main

import (
	"encoding/json"
	"fmt"
	"os/exec"

	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	// List all environments
	app.Get("/api/environments", func(c *fiber.Ctx) error {
		cmd := exec.Command("container-use", "list", "--json")
		output, err := cmd.Output()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":  "Failed to run 'container-use list'",
				"detail": err.Error(),
			})
		}

		var result interface{}
		if err := json.Unmarshal(output, &result); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":  "Failed to parse CLI JSON output",
				"detail": err.Error(),
			})
		}

		return c.JSON(result)
	})

	// Get logs for a specific environment
	app.Get("/api/environments/:id/logs", func(c *fiber.Ctx) error {
		id := c.Params("id")
		cmd := exec.Command("container-use", "log", id)
		output, err := cmd.CombinedOutput()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":  fmt.Sprintf("Failed to get logs for env %s", id),
				"detail": string(output),
			})
		}
		return c.SendString(string(output))
	})

	// Get diff for a specific environment
	app.Get("/api/environments/:id/diff", func(c *fiber.Ctx) error {
		id := c.Params("id")
		cmd := exec.Command("container-use", "diff", id)
		output, err := cmd.CombinedOutput()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":  fmt.Sprintf("Failed to get diff for env %s", id),
				"detail": string(output),
			})
		}
		return c.SendString(string(output))
	})

	// Start server
	app.Listen(":8080")
}
