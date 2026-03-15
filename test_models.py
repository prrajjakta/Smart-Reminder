from models import Reminder

reminder = Reminder(
    id=1,
    title="Workout",
    category="fitness",
    scheduled_time="06:00",
    priority=1
)

print(reminder)