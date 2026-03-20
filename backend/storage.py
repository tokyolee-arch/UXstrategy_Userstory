import json
import threading
from pathlib import Path
from models import UserStoryItem, Stage

DATA_DIR = Path(__file__).parent / "data"
STORIES_FILE = DATA_DIR / "stories.json"
STAGES_FILE = DATA_DIR / "stages.json"

_lock = threading.Lock()


def _ensure_files():
    DATA_DIR.mkdir(exist_ok=True)
    if not STORIES_FILE.exists():
        STORIES_FILE.write_text("[]", encoding="utf-8")
    if not STAGES_FILE.exists():
        default_stages = [
            {"id": 0, "title": "단계 1", "description": None},
            {"id": 1, "title": "단계 2", "description": None},
            {"id": 2, "title": "단계 3", "description": None},
            {"id": 3, "title": "단계 4", "description": None},
        ]
        STAGES_FILE.write_text(json.dumps(default_stages, ensure_ascii=False, indent=2), encoding="utf-8")


_ensure_files()


# --- Items ---

def load_items() -> list[UserStoryItem]:
    with _lock:
        data = json.loads(STORIES_FILE.read_text(encoding="utf-8"))
        return [UserStoryItem(**item) for item in data]


def save_items(items: list[UserStoryItem]):
    with _lock:
        data = [item.model_dump() for item in items]
        STORIES_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def add_item(item: UserStoryItem) -> UserStoryItem:
    items = load_items()
    items.append(item)
    save_items(items)
    return item


def update_item(item_id: str, updates: dict) -> UserStoryItem | None:
    items = load_items()
    for i, item in enumerate(items):
        if item.id == item_id:
            updated = item.model_copy(update={k: v for k, v in updates.items() if v is not None})
            items[i] = updated
            save_items(items)
            return updated
    return None


def delete_item(item_id: str) -> bool:
    items = load_items()
    new_items = [item for item in items if item.id != item_id]
    if len(new_items) < len(items):
        save_items(new_items)
        return True
    return False


# --- Stages ---

def load_stages() -> list[Stage]:
    with _lock:
        data = json.loads(STAGES_FILE.read_text(encoding="utf-8"))
        return [Stage(**s) for s in data]


def save_stages(stages: list[Stage]):
    with _lock:
        data = [s.model_dump() for s in stages]
        STAGES_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def add_stage(title: str, description: str | None = None) -> Stage:
    stages = load_stages()
    new_id = max((s.id for s in stages), default=-1) + 1
    stage = Stage(id=new_id, title=title, description=description)
    stages.append(stage)
    save_stages(stages)
    return stage


def update_stage(stage_id: int, title: str | None = None, description: str | None = None) -> Stage | None:
    stages = load_stages()
    for i, s in enumerate(stages):
        if s.id == stage_id:
            if title is not None:
                s.title = title
            if description is not None:
                s.description = description
            stages[i] = s
            save_stages(stages)
            return s
    return None


def delete_stage(stage_id: int) -> bool:
    stages = load_stages()
    new_stages = [s for s in stages if s.id != stage_id]
    if len(new_stages) < len(stages):
        save_stages(new_stages)
        return True
    return False
