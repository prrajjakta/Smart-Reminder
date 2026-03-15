from events import Event
from storage import event_logs
from learning import update_preference
from datetime import datetime

def handle_user_action(reminder_id, category, action, value=None):
    event = Event(
        reminder_id=reminder_id,
        action=action,
        timestamp=str(datetime.now()),
        value=value
    )
    event_logs.append(event)
    if action == "snooze" and value is not None:
        update_preference(category, value)
    return event