# 🌸 Remindly - Smart Reminder App

A habit-aware reminder web app that learns your scheduling preferences over time and surfaces the most relevant suggestions first.

Built with Python (FastAPI) on the backend and vanilla JavaScript on the frontend, with real native OS notifications via the Web Notifications API and Service Workers.

---

## ✨ Features

- **AI-driven time suggestions** — tracks which times you pick and snooze, scores them using a preference learning algorithm, and ranks options smartest-first
- **Native OS notifications** — fires desktop alerts at the exact scheduled time using a Service Worker, even when the browser tab is in the background
- **Custom categories & reminders** — add your own categories and tasks; everything persists across sessions via JSON-backed storage
- **Repeat scheduling** — set reminders to repeat Daily or on specific days of the week
- **Pause / Resume reminders** — toggle individual reminders without deleting them
- **Pastel pink & sky blue UI** — clean, minimal interface that doesn't get in the way

---

## 🛠️ Tech Stack

|    Layer      |                Technology              |
|---------------|----------------------------------------|
| Backend       | Python, FastAPI, Pydantic              |
| Frontend      | Vanilla JavaScript, HTML, CSS          |
| Notifications | Web Notifications API, Service Workers |
| Storage       | JSON file-based persistence            |
| Server        | Uvicorn (ASGI)                         |



## 🚀 How to Run

**Requirements:** Python 3.9+

```bash
# Clone the repo
git clone https://github.com/prrajjakta/Smart-Reminder.git
cd Smart-Reminder

# Run the app (installs dependencies automatically)
python run.py
```

The app will open at **http://localhost:8000** in your browser.

> `run.py` automatically installs `fastapi`, `uvicorn`, `jinja2`, and `pydantic` if they aren't already installed.

---

## 📁 Project Structure

```
smart_reminder/
│
├── main.py              # FastAPI app — all routes and API endpoints
├── run.py               # One-click startup script
├── events.py            # Category & task definitions, persistence
├── learning.py          # Preference scoring & ranking algorithm
├── storage.py           # Load/save preferences
├── action_handler.py    # Handles user actions (snooze, pick)
├── models.py            # Pydantic data models
│
├── templates/
│   └── index.html       # Full frontend (HTML + CSS)
│
└── static/
    ├── script.js        # All frontend logic (JS)
    └── sw.js            # Service Worker for background notifications
```

---

## 🧠 How the AI Part Works

The app uses a simple but effective **preference learning loop**:

1. Every time you pick or snooze a time suggestion, that option's score increases in `preferences.json`
2. On next load, `learning.py` sorts all options by score (descending) and returns them ranked
3. The top option is highlighted as the **Top Pick**
4. Over time the app adapts to *your* schedule — morning person? It'll stop suggesting 11 PM

This is a lightweight implementation of a **feedback-based ranking system** — the same core idea behind recommendation engines.

---

## 📸 Screenshots

| Reminders View | New Reminder | AI Suggestions |
|---|---|---|
| Clock, next reminder pill, reminder cards | Task + category + time + repeat days | Ranked suggestions with score bars |

---

## 📌 Future Improvements

- [ ] Email / SMS notification fallback
- [ ] Multiple user profiles
- [ ] Calendar view
- [ ] Export reminders
- [ ] Dark mode toggle

---

## 👩‍💻 Author

**Prajakta Padwalkar**  
D Y Patil University, Pune  
AI-ML Virtual Internship — Google for Developers & AICTE (Oct–Dec 2025) · Grade: O (Outstanding)

[![GitHub](https://img.shields.io/badge/GitHub-prrajjakta-181717?style=flat&logo=github)](https://github.com/prrajjakta)
