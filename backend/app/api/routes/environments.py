"""
Environment management routes for Container Use API.
"""

import asyncio
from typing import Any, List

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.core.container_use import (
    parse_environment_list,
    run_container_use_command,
)
from app.core.config import settings
from app.models import (
    ActionRequest,
    ActionResponse,
    Environment,
)

router = APIRouter(prefix="/environments", tags=["environments"])


@router.get("/", response_model=List[Environment])
async def list_environments() -> Any:
    """
    List all container-use environments.
    """
    stdout, stderr, return_code = await run_container_use_command(["list"])

    if return_code != 0:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to run 'container-use list'",
                "detail": stderr or "Unknown error",
            },
        )

    try:
        environments = parse_environment_list(stdout)
        return environments
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to parse environment list", "detail": str(e)},
        )


@router.get("/{environment_id}/logs")
async def get_environment_logs(environment_id: str) -> Any:
    """
    Get logs for a specific environment by ID.
    """
    if not environment_id:
        raise HTTPException(
            status_code=400, detail={"error": "Environment ID is required"}
        )

    stdout, stderr, return_code = await run_container_use_command(
        ["log", environment_id]
    )

    if return_code != 0:
        # Check if it's a "not found" type error
        error_output = stderr or stdout
        is_not_found = (
            "not found" in error_output.lower()
            or "does not exist" in error_output.lower()
        )
        if is_not_found:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": f"Environment '{environment_id}' not found",
                    "detail": error_output,
                },
            )
        raise HTTPException(
            status_code=500,
            detail={
                "error": (f"Failed to get logs for environment '{environment_id}'"),
                "detail": error_output,
            },
        )

    return stdout


@router.get("/{environment_id}/diff")
async def get_environment_diff(environment_id: str) -> Any:
    """
    Get diff for a specific environment by ID.
    """
    if not environment_id:
        raise HTTPException(
            status_code=400, detail={"error": "Environment ID is required"}
        )

    stdout, stderr, return_code = await run_container_use_command(
        ["diff", environment_id]
    )

    if return_code != 0:
        # Check if it's a "not found" type error
        error_output = stderr or stdout
        is_not_found = (
            "not found" in error_output.lower()
            or "does not exist" in error_output.lower()
        )
        if is_not_found:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": f"Environment '{environment_id}' not found",
                    "detail": error_output,
                },
            )
        raise HTTPException(
            status_code=500,
            detail={
                "error": (f"Failed to get diff for environment '{environment_id}'"),
                "detail": error_output,
            },
        )

    return stdout


@router.post("/actions", response_model=ActionResponse)
async def execute_action(request: ActionRequest) -> Any:
    """
    Execute an action on an environment (apply, checkout, delete, merge).
    """
    if not request.action or not request.environment_id:
        raise HTTPException(
            status_code=400, detail={"error": "Action and environment_id are required"}
        )

    # Validate action
    valid_actions = {"apply", "checkout", "delete", "merge"}
    if request.action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid action",
                "detail": f"Action must be one of: {', '.join(valid_actions)}",
            },
        )

    # Execute the command
    stdout, stderr, return_code = await run_container_use_command(
        [request.action, request.environment_id]
    )

    if return_code != 0:
        # Check if it's a "not found" type error
        error_output = stderr or stdout
        is_not_found = (
            "not found" in error_output.lower()
            or "does not exist" in error_output.lower()
        )
        if is_not_found:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": (f"Environment '{request.environment_id}' not found"),
                    "detail": error_output,
                },
            )
        raise HTTPException(
            status_code=500,
            detail={
                "error": (
                    f"Failed to execute '{request.action}' on environment "
                    f"'{request.environment_id}'"
                ),
                "detail": error_output,
            },
        )

    return ActionResponse(
        success=True,
        action=request.action,
        environment_id=request.environment_id,
        output=stdout,
    )


# WebSocket endpoints


async def watch_environments_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time environment activity updates.
    """
    await websocket.accept()

    try:
        # Start the container-use watch command
        process = await asyncio.create_subprocess_exec(
            settings.get_container_use_bin(),
            "watch",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=settings.get_container_use_work_dir(),
        )

        # Handle stdout
        async def handle_stdout():
            while True:
                try:
                    line = await process.stdout.readline()
                    if not line:
                        break
                    await websocket.send_json(
                        {"type": "stdout", "data": line.decode("utf-8")}
                    )
                except Exception:
                    break

        # Handle stderr
        async def handle_stderr():
            while True:
                try:
                    line = await process.stderr.readline()
                    if not line:
                        break
                    await websocket.send_json(
                        {"type": "stderr", "data": line.decode("utf-8")}
                    )
                except Exception:
                    break

        # Start handling both streams
        tasks = [
            asyncio.create_task(handle_stdout()),
            asyncio.create_task(handle_stderr()),
        ]

        try:
            # Wait for WebSocket close or command completion
            while True:
                try:
                    await websocket.receive_text()
                except WebSocketDisconnect:
                    break
        finally:
            # Clean up
            if process.returncode is None:
                process.terminate()
                try:
                    await asyncio.wait_for(process.wait(), timeout=5.0)
                except asyncio.TimeoutError:
                    process.kill()
                    await process.wait()

            # Cancel tasks
            for task in tasks:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json(
                {"type": "error", "data": f"WebSocket error: {str(e)}"}
            )
        except Exception:
            pass


async def terminal_websocket(websocket: WebSocket, environment_id: str):
    """
    WebSocket endpoint for terminal access to environment container.
    """
    await websocket.accept()

    if not environment_id:
        await websocket.send_json({"error": "Environment ID is required"})
        await websocket.close()
        return

    try:
        # Start the container-use terminal command
        process = await asyncio.create_subprocess_exec(
            settings.get_container_use_bin(),
            "terminal",
            environment_id,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=settings.get_container_use_work_dir(),
        )

        # Handle stdout
        async def handle_stdout():
            while True:
                try:
                    data = await process.stdout.read(1024)
                    if not data:
                        break
                    await websocket.send_json(
                        {"type": "stdout", "data": data.decode("utf-8")}
                    )
                except Exception:
                    break

        # Handle stderr
        async def handle_stderr():
            while True:
                try:
                    data = await process.stderr.read(1024)
                    if not data:
                        break
                    await websocket.send_json(
                        {"type": "stderr", "data": data.decode("utf-8")}
                    )
                except Exception:
                    break

        # Handle WebSocket input
        async def handle_websocket_input():
            while True:
                try:
                    message = await websocket.receive_json()
                    if message.get("type") == "stdin":
                        data = message.get("data", "")
                        process.stdin.write(data.encode("utf-8"))
                        await process.stdin.drain()
                except WebSocketDisconnect:
                    break
                except Exception:
                    break

        # Start handling all streams
        tasks = [
            asyncio.create_task(handle_stdout()),
            asyncio.create_task(handle_stderr()),
            asyncio.create_task(handle_websocket_input()),
        ]

        try:
            # Wait for any task to complete (usually means connection closed)
            done, pending = await asyncio.wait(
                tasks, return_when=asyncio.FIRST_COMPLETED
            )
        finally:
            # Clean up
            if process.returncode is None:
                if process.stdin:
                    process.stdin.close()
                process.terminate()
                try:
                    await asyncio.wait_for(process.wait(), timeout=5.0)
                except asyncio.TimeoutError:
                    process.kill()
                    await process.wait()

            # Cancel remaining tasks
            for task in tasks:
                if not task.done():
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json(
                {"type": "error", "data": f"Terminal error: {str(e)}"}
            )
        except Exception:
            pass
