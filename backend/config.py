import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_api_key: str = ""
    upload_dir: str = "/tmp/uploads"
    report_dir: str = "/tmp/reports"

    class Config:
        env_file = "../.env" if os.path.exists("../.env") else None


settings = Settings()