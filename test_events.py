from events import Event
from storage import event_logs

event = Event(
    reminder_id=1,
    action="skip",
    timestamp="2026-01-24 06:00"
)

event_logs.append(event)

print(event_logs)