"""MongoDB ObjectId の Pydantic v2 シリアライゼーションヘルパー。"""

from typing import Annotated, Any

from bson import ObjectId
from pydantic import BeforeValidator


def _validate_object_id(v: Any) -> str:
    """ObjectId を文字列に変換するバリデーター。"""
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str) and ObjectId.is_valid(v):
        return v
    raise ValueError(f"Invalid ObjectId: {v}")


PyObjectId = Annotated[str, BeforeValidator(_validate_object_id)]
