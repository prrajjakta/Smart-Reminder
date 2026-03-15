import json
import os

TASKS_FILE = "category_tasks.json"

DEFAULT_CATEGORY_TASKS = {
    "Skincare": ["sunscreen","facewash","hair_serum","rosemary_water"],
    "Fitness": ["workout","stretching","hydration"],
    "Study": ["revision","assignment","practice"],
    "Health": ["sleep","meditation","water_intake"]
}

def load_category_tasks():
    if os.path.exists(TASKS_FILE):
        try:
            with open(TASKS_FILE, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            pass
    return dict(DEFAULT_CATEGORY_TASKS)

def save_category_tasks(tasks):
    with open(TASKS_FILE, "w") as f:
        json.dump(tasks, f, indent=4)

CATEGORY_TASKS = load_category_tasks()

from pydantic import BaseModel
from typing import Optional


class Event(BaseModel):
    reminder_id: int
    action: str
    timestamp: str
    value: Optional[str] = None