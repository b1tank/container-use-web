"""
Database and API models for Container Use UI.
"""

from typing import Optional
from pydantic import BaseModel


class Environment(BaseModel):
    """Represents a container-use environment."""

    id: str
    title: str
    created: str
    updated: str


class ActionRequest(BaseModel):
    """Request model for performing actions on environments."""

    action: str
    environment_id: str


class ActionResponse(BaseModel):
    """Response model for action execution."""

    success: bool
    action: str
    environment_id: str
    output: str


class Message(BaseModel):
    """Generic message response."""

    message: str


class ErrorResponse(BaseModel):
    """Error response model."""

    error: str
    detail: Optional[str] = None


class WebSocketMessage(BaseModel):
    """WebSocket message model."""

    type: str
    data: str
