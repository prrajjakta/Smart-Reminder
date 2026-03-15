import os, json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from typing import Optional, List
from pydantic import BaseModel

# ── All paths relative to THIS file, not cwd ──
BASE = Path(__file__).parent.resolve()
REMINDERS_FILE  = BASE / "reminders_data.json"
TASKS_FILE      = BASE / "category_tasks.json"
PREFS_FILE      = BASE / "preferences.json"

# ── Change cwd to the app folder so uvicorn finds everything ──
os.chdir(BASE)

# ── Load helpers ──
def _load(path, default):
    try:
        if path.exists():
            return json.loads(path.read_text())
    except: pass
    return default

def _save(path, data):
    path.write_text(json.dumps(data, indent=2))

DEFAULT_TASKS = {
    "Skincare": ["sunscreen","facewash","hair_serum","rosemary_water"],
    "Fitness":  ["workout","stretching","hydration"],
    "Study":    ["revision","assignment","practice"],
    "Health":   ["sleep","meditation","water_intake"]
}
DEFAULT_PREFS = {
    "Fitness":  {"1_hour":1,"2_hours":1,"7_PM":1,"8_PM":1},
    "Skincare": {"short_routine":1,"30_min":1},
    "Study":    {"later_today":1,"tomorrow_morning":1,"weekend":1},
    "Health":   {"15_min":1,"30_min":1}
}

CATEGORY_TASKS  = _load(TASKS_FILE, dict(DEFAULT_TASKS))
preferences     = _load(PREFS_FILE,  dict(DEFAULT_PREFS))
reminders_store = _load(REMINDERS_FILE, [])

# ── Models ──
class ReminderEntry(BaseModel):
    id:       Optional[int]  = None
    title:    str
    category: str
    task:     Optional[str]  = ""
    time:     str
    days:     List[str]
    note:     Optional[str]  = ""
    active:   Optional[bool] = True

# ── App ──
app = FastAPI()
app.mount("/static",   StaticFiles(directory=str(BASE/"static")),    name="static")
templates = Jinja2Templates(directory=str(BASE/"templates"))

# ── Routes ──
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/ping")
def ping():
    return {"ok": True, "reminders": len(reminders_store), "categories": list(CATEGORY_TASKS.keys())}

@app.get("/categories")
def get_categories():
    return {"categories": list(CATEGORY_TASKS.keys())}

@app.post("/categories")
def add_category(name: str):
    name = name.strip().capitalize()
    if not name: raise HTTPException(400, "Empty name")
    if name in CATEGORY_TASKS: raise HTTPException(400, "Already exists")
    CATEGORY_TASKS[name] = []
    _save(TASKS_FILE, CATEGORY_TASKS)
    preferences[name] = {}
    _save(PREFS_FILE, preferences)
    return {"status": "ok", "category": name}

@app.delete("/categories/{category}")
def del_category(category: str):
    category = category.capitalize()
    if category not in CATEGORY_TASKS: raise HTTPException(404, "Not found")
    del CATEGORY_TASKS[category]
    _save(TASKS_FILE, CATEGORY_TASKS)
    preferences.pop(category, None)
    _save(PREFS_FILE, preferences)
    return {"status": "ok"}

@app.get("/tasks/{category}")
def get_tasks(category: str):
    return {"tasks": CATEGORY_TASKS.get(category.capitalize(), [])}

@app.post("/tasks/{category}")
def add_task(category: str, task: str):
    category = category.capitalize()
    task = task.strip().lower().replace(" ", "_")
    if category not in CATEGORY_TASKS: raise HTTPException(404, "Category not found")
    if task in CATEGORY_TASKS[category]: raise HTTPException(400, "Task exists")
    CATEGORY_TASKS[category].append(task)
    _save(TASKS_FILE, CATEGORY_TASKS)
    return {"status": "ok", "task": task}

@app.delete("/tasks/{category}/{task}")
def del_task(category: str, task: str):
    category = category.capitalize()
    if category not in CATEGORY_TASKS: raise HTTPException(404)
    if task not in CATEGORY_TASKS[category]: raise HTTPException(404)
    CATEGORY_TASKS[category].remove(task)
    _save(TASKS_FILE, CATEGORY_TASKS)
    return {"status": "ok"}

@app.get("/reminders")
def get_reminders():
    return {"reminders": reminders_store}

@app.post("/reminders")
def create_reminder(r: ReminderEntry):
    new_id = max((x["id"] for x in reminders_store), default=0) + 1
    try:    entry = r.model_dump()
    except: entry = r.dict()
    entry["id"] = new_id
    entry["active"] = True
    reminders_store.append(entry)
    _save(REMINDERS_FILE, reminders_store)
    return {"status": "ok", "reminder": entry}

@app.delete("/reminders/{rid}")
def del_reminder(rid: int):
    global reminders_store
    reminders_store = [x for x in reminders_store if x["id"] != rid]
    _save(REMINDERS_FILE, reminders_store)
    return {"status": "ok"}

@app.put("/reminders/{rid}/toggle")
def toggle_reminder(rid: int):
    for r in reminders_store:
        if r["id"] == rid:
            r["active"] = not r.get("active", True)
            _save(REMINDERS_FILE, reminders_store)
            return {"status": "ok", "active": r["active"]}
    raise HTTPException(404)

@app.get("/suggestions/{category}")
def get_suggestions(category: str):
    if category not in preferences: raise HTTPException(404)
    opts = preferences[category]
    ranked = sorted(opts.items(), key=lambda x: x[1], reverse=True)
    return {"category": category, "suggestions": ranked}

@app.post("/action")
def action(reminder_id: int, category: str, action: str, value: str = None):
    if category in preferences and value:
        preferences[category].setdefault(value, 0)
        preferences[category][value] += 1
        _save(PREFS_FILE, preferences)
    return {"status": "ok"}

@app.get("/notify/due")
def notify_due():
    from datetime import datetime
    now = datetime.now()
    t = now.strftime("%H:%M")
    day = now.strftime("%a")
    due = [r for r in reminders_store
           if r.get("active", True)
           and r.get("time") == t
           and ("Daily" in r.get("days",[]) or day in r.get("days",[]))]
    return {"due": due}
