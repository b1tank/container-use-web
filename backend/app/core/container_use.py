"""
Utility functions for interacting with container-use CLI.
"""

import asyncio
import re
import subprocess
from typing import List

from app.core.config import settings
from app.models import Environment


async def run_container_use_command(
    args: List[str], cwd: str = None
) -> tuple[str, str, int]:
    """
    Run a container-use command asynchronously.

    Args:
        args: Command arguments including the subcommand
        cwd: Working directory for the command

    Returns:
        Tuple of (stdout, stderr, return_code)
    """
    if cwd is None:
        cwd = settings.get_container_use_work_dir()

    cmd = [settings.get_container_use_bin()] + args
    print(f"Running command: {' '.join(cmd)} in directory: {cwd}")

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd,
        )

        stdout, stderr = await process.communicate()
        return (
            stdout.decode("utf-8") if stdout else "",
            stderr.decode("utf-8") if stderr else "",
            process.returncode or 0,
        )
    except Exception as e:
        return "", str(e), 1


def parse_environment_list(output: str) -> List[Environment]:
    """
    Parse the table output from 'container-use list' command.

    Args:
        output: Raw output from the list command

    Returns:
        List of Environment objects
    """
    environments = []
    lines = output.strip().split("\n")

    # Skip header line if present (starts with "ID")
    start_index = 0
    for i, line in enumerate(lines):
        if line.strip().startswith("ID"):
            start_index = i + 1
            break

    # Parse each environment line
    for i in range(start_index, len(lines)):
        line = lines[i].strip()
        if not line:
            continue

        # Split by multiple spaces to handle the table format
        fields = re.split(r"\s{2,}", line)

        if len(fields) >= 4:
            env = Environment(
                id=fields[0].strip(),
                title=fields[1].strip(),
                created=fields[2].strip(),
                updated=fields[3].strip(),
            )
            environments.append(env)

    return environments


def run_container_use_command_sync(
    args: List[str], cwd: str = None
) -> tuple[str, str, int]:
    """
    Run a container-use command synchronously.

    Args:
        args: Command arguments including the subcommand
        cwd: Working directory for the command

    Returns:
        Tuple of (stdout, stderr, return_code)
    """
    if cwd is None:
        cwd = settings.get_container_use_work_dir()

    cmd = [settings.get_container_use_bin()] + args
    print(f"Running command: {' '.join(cmd)} in directory: {cwd}")

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
        return result.stdout, result.stderr, result.returncode
    except Exception as e:
        return "", str(e), 1
