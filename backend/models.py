from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class Stage(BaseModel):
    id: int
    title: str
    description: Optional[str] = None


class UserStoryItemCreate(BaseModel):
    author: str
    stage_id: int
    text: str
    category: str = Field(..., pattern=r"^(기능|사양|서비스|사업요소)$")
    category_item: str


class UserStoryItemUpdate(BaseModel):
    author: Optional[str] = None
    stage_id: Optional[int] = None
    text: Optional[str] = None
    category: Optional[str] = None
    category_item: Optional[str] = None


class UserStoryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    author: str
    stage_id: int
    text: str
    category: str
    category_item: str
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    group_id: Optional[str] = None


class StageCreate(BaseModel):
    title: str
    description: Optional[str] = None


class GroupedElements(BaseModel):
    기능: list[str] = []
    사양: list[str] = []
    서비스: list[str] = []
    사업요소: list[str] = []


class StageGroup(BaseModel):
    user_stories: list[str] = []
    elements: GroupedElements = GroupedElements()


class GroupedResult(BaseModel):
    stages: list[Stage] = []
    groups: dict[int, StageGroup] = {}
