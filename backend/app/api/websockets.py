"""
WebSocket routes for Container Use API.
"""

from fastapi import APIRouter

from app.api.routes.environments import watch_environments_websocket, terminal_websocket

# Create WebSocket router
ws_router = APIRouter(prefix="/ws")

# Add WebSocket routes
ws_router.add_websocket_route("/environments/watch", watch_environments_websocket)
ws_router.add_websocket_route(
    "/environments/{environment_id}/terminal", terminal_websocket
)
