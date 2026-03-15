import json
import os

FILE_PATH = "preferences.json"

def load_preferences():
    if os.path.exists(FILE_PATH):
        try:
            with open(FILE_PATH, "r") as file:
                data = json.load(file)
                return data
        except json.JSONDecodeError:
            print("⚠️ preferences.json is empty or corrupted. Loading defaults.")
    
    # default preferences if file does not exist OR is corrupted
    return {
        "Fitness": {
            "1_hour": 1,
            "2_hours": 1,
            "7_PM": 1,
            "8_PM": 1
        },
        "Skincare": {
            "short_routine": 1,
            "30_min": 1
        },
        "Study": {
            "later_today": 1,
            "tomorrow_morning": 1,
            "weekend": 1
        },
        "Health": {
            "15_min": 1,
            "30_min": 1
        }
    }

# part 2

def save_preferences(preferences):
    with open(FILE_PATH, "w") as file:
        json.dump(preferences, file, indent=4)


# PART 3

event_logs = []

preferences = load_preferences()