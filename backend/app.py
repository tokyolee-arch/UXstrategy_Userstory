from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from collections import defaultdict
import tempfile
import os

from models import (
    UserStoryItem, UserStoryItemCreate, UserStoryItemUpdate,
    StageCreate, Stage, GroupedResult, StageGroup, GroupedElements,
)
import storage
from similarity import process_items, deduplicate, group_similar, merge_group
from ppt_generator import generate_ppt

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"

app = FastAPI(title="User Story PPT Automation Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
def serve_frontend():
    return (FRONTEND_DIR / "index.html").read_text(encoding="utf-8")


# --- Stages ---

@app.get("/api/stages", response_model=list[Stage])
def get_stages():
    return storage.load_stages()


@app.post("/api/stages", response_model=Stage)
def create_stage(body: StageCreate):
    return storage.add_stage(body.title, body.description)


@app.put("/api/stages/{stage_id}", response_model=Stage)
def update_stage(stage_id: int, body: StageCreate):
    result = storage.update_stage(stage_id, body.title, body.description)
    if not result:
        raise HTTPException(404, "Stage not found")
    return result


@app.delete("/api/stages/{stage_id}")
def delete_stage(stage_id: int):
    if not storage.delete_stage(stage_id):
        raise HTTPException(404, "Stage not found")
    return {"ok": True}


# --- Items ---

@app.get("/api/items", response_model=list[UserStoryItem])
def get_items():
    return storage.load_items()


@app.post("/api/items", response_model=UserStoryItem)
def create_item(body: UserStoryItemCreate):
    item = UserStoryItem(**body.model_dump())
    return storage.add_item(item)


@app.put("/api/items/{item_id}", response_model=UserStoryItem)
def update_item(item_id: str, body: UserStoryItemUpdate):
    result = storage.update_item(item_id, body.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(404, "Item not found")
    return result


@app.delete("/api/items/{item_id}")
def delete_item(item_id: str):
    if not storage.delete_item(item_id):
        raise HTTPException(404, "Item not found")
    return {"ok": True}


# --- Grouping ---

@app.post("/api/group")
def run_grouping(threshold: float = 0.35):
    items = storage.load_items()
    stages = storage.load_stages()

    # category_item 기준으로 그룹핑
    items_by_key: dict[tuple, list[str]] = defaultdict(list)
    for item in items:
        key = (item.stage_id, item.category)
        items_by_key[key].append(item.category_item)

    # user_story text 기준으로도 그룹핑
    stories_by_stage: dict[int, list[str]] = defaultdict(list)
    for item in items:
        stories_by_stage[item.stage_id].append(item.text)

    # 처리
    merged_elements = process_items(items_by_key, threshold)
    merged_stories = {}
    for stage_id, texts in stories_by_stage.items():
        groups = group_similar(texts, threshold)
        merged_stories[stage_id] = [merge_group(g) for g in groups]

    # 결과 구성
    result = GroupedResult(stages=stages)
    for stage in stages:
        sid = stage.id
        elements = GroupedElements(
            기능=merged_elements.get((sid, "기능"), []),
            사양=merged_elements.get((sid, "사양"), []),
            서비스=merged_elements.get((sid, "서비스"), []),
            사업요소=merged_elements.get((sid, "사업요소"), []),
        )
        result.groups[sid] = StageGroup(
            user_stories=merged_stories.get(sid, []),
            elements=elements,
        )

    return result


@app.get("/api/grouped")
def get_grouped(threshold: float = 0.35):
    return run_grouping(threshold)


# --- PPT Export ---

@app.post("/api/export/ppt")
def export_ppt(threshold: float = 0.35):
    grouped = run_grouping(threshold)
    tmp = tempfile.NamedTemporaryFile(suffix=".pptx", delete=False, prefix="userstory_")
    try:
        generate_ppt(grouped, tmp.name)
        return FileResponse(
            tmp.name,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename="user_story_map.pptx",
        )
    except Exception as e:
        os.unlink(tmp.name)
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
