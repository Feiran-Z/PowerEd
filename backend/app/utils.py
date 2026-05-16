import shutil
import zipfile
from pathlib import Path
import time
import asyncio
from typing import Optional

# === File & directory helpers ===

def ensure_dir(path: Path) -> Path:
    """Create directory if it doesn't exist, return the Path."""
    path.mkdir(parents=True, exist_ok=True)
    return path

def zip_output_folder(folder_path: Path, zip_path: Path) -> Path:
    """
    Zip the contents of folder_path into zip_path.
    Returns the zip_path.
    """
    # Use shutil.make_archive (creates .zip)
    base_name = str(zip_path.with_suffix(''))
    shutil.make_archive(base_name, 'zip', folder_path)
    return zip_path

def cleanup_old_workspaces(upload_dir: Path, results_dir: Path, max_age_hours: int = 1):
    """
    Delete workspace directories and result zips older than max_age_hours.
    Called by a background task or cron.
    """
    now = time.time()
    max_age_seconds = max_age_hours * 3600

    for item in upload_dir.iterdir():
        if item.is_dir() and (now - item.stat().st_mtime) > max_age_seconds:
            shutil.rmtree(item, ignore_errors=True)

    for item in results_dir.iterdir():
        if item.is_file() and item.suffix == '.zip' and (now - item.stat().st_mtime) > max_age_seconds:
            item.unlink(missing_ok=True)

# === Async helpers (optional) ===

async def run_in_executor(func, *args):
    """Run a blocking function in a thread pool (for zip operations)."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, func, *args)