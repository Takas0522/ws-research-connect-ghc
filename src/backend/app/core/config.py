"""アプリケーション設定。pydantic-settings で .env から読み込む。"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """アプリケーション全体の設定。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    MONGO_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "saas_management"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]


settings = Settings()
