from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler

from .paths import ServicePaths, ensure_runtime_dirs


def configure_logging(paths: ServicePaths) -> logging.Logger:
  ensure_runtime_dirs(paths)
  logger = logging.getLogger('coursehub_backup')
  configured_path = getattr(logger, '_coursehub_log_path', None)
  if configured_path == str(paths.log_path):
    return logger

  if logger.handlers:
    for handler in logger.handlers:
      logger.removeHandler(handler)
      handler.close()

  logger.setLevel(logging.INFO)
  logger.propagate = False

  handler = RotatingFileHandler(
    paths.log_path,
    maxBytes=1_000_000,
    backupCount=5,
    encoding='utf-8',
  )
  formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
  handler.setFormatter(formatter)
  logger.addHandler(handler)

  logger._coursehub_configured = True  # type: ignore[attr-defined]
  logger._coursehub_log_path = str(paths.log_path)  # type: ignore[attr-defined]
  return logger
