from typing import Annotated, Any, Literal
import os

from pydantic import (
    AnyUrl,
    BeforeValidator,
    computed_field,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Use top level .env file (one level above ./backend/)
        env_file="../.env",
        env_ignore_empty=True,
        extra="ignore",
    )
    PROJECT_NAME: str = "Container Use API"
    API_V1_STR: str = "/api/v1"
    # 60 minutes * 24 hours * 8 days = 8 days
    FRONTEND_HOST: str = "http://localhost:5173"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    # Container-use specific settings
    CONTAINER_USE_BIN: str = "container-use"
    CONTAINER_USE_WORK_DIR: str = "."

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        """Returns a list of all CORS origins, including the frontend host."""
        origins = [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS]
        return origins + [self.FRONTEND_HOST]

    def get_container_use_bin(self) -> str:
        """Get container-use binary path from environment or use default."""
        return os.getenv("CONTAINER_USE_BIN", self.CONTAINER_USE_BIN)

    def get_container_use_work_dir(self) -> str:
        """Get container-use work directory from environment or use default."""
        return os.getenv("CONTAINER_USE_WORK_DIR", self.CONTAINER_USE_WORK_DIR)


settings = Settings()  # type: ignore
