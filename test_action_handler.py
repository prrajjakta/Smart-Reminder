from action_handler import handle_user_action
from learning import rank_options

print("Before action:")
print(rank_options("Fitness"))

handle_user_action(
    reminder_id=1,
    category="Fitness",
    action="snooze",
    value="7_PM"
)

print("\n After action:")
print(rank_options("Fitness"))