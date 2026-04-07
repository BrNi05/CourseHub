"""
Logging configuration for the backup service.

This module configures a dedicated application logger with:
- rotating file logging
- runtime directory preparation
"""

from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler

from .paths import ServicePaths, ensure_runtime_dirs


def configure_logging(paths: ServicePaths) -> logging.Logger:
    """
    Configure and return the application logger.

    This function:
    - Ensures runtime directories exist
    - Initializes a named logger (coursehub_backup)
    - Attaches a rotating file handler

    Args:
        paths (ServicePaths): Resolved filesystem paths for log output.

    Returns:
        logging.Logger: Configured application logger.
    """

    ensure_runtime_dirs(paths)

    logger = logging.getLogger('coursehub_backup')  # global

    if logger.handlers:
        for handler in logger.handlers:
            logger.removeHandler(handler)
            handler.close()

    logger.setLevel(logging.INFO)
    logger.propagate = False

    handler = RotatingFileHandler(
      paths.log_path,
      maxBytes=5_000_000,
      backupCount=2,
      encoding='utf-8',
    )

    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger
