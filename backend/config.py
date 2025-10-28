"""Application configuration settings for authentication utilities."""
from datetime import timedelta
from typing import Final
import os


SECRET_KEY: Final[str] = os.getenv("DMS_JWT_SECRET", "change-me")
ALGORITHM: Final[str] = os.getenv("DMS_JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE: Final[timedelta] = timedelta(
    minutes=int(os.getenv("DMS_JWT_EXP_MINUTES", "30"))
)
