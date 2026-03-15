from learning import rank_options
from action_handler import handle_user_action

def show_reminder(category):
    print("\n🔔 Reminder")
    print("Category: {category}")

def get_user_action():
    print("\nChoose an action:")
    print("1. Complete")
    print("2. Snooze")
    print("3. Skip")
    
    choice = input("Enter choice (1/2/3): ")
    return choice

def handle_snooze(category):
    print("\nYou chose to snooze.")
    options = rank_options(category)
    
    print("Recommended snooze options:")
    for i, (option, score) in enumerate(options, start=1):
        print(f"{i}. {option} (score: {score})")
        
    choice = input("Choose an option number: ")
    selected_option = options[int(choice) - 1] [0]
    
    handle_user_action(
        reminder_id=1,
        category=category,
        action="snooze",
        value=selected_option   
    )
    
    print(f"Snoozed to {selected_option}")
    
def main():
    category = input("\n Enter category (Fitness / Skincare / Study / Health): ")
    show_reminder(category)
    action = get_user_action()
    
    if action == "1":
        handle_user_action(1, category, "complete")
        print("✅ completed!")
        
    elif action == "2":
        handle_snooze(category)
    
    elif action == "3":
        if category == "Health":
            print("❌ Cannot skip health reminders.")
        else:
            handle_user_action(1, category, "skip")
            print("⏭️ Skipped.")
        
    else:
        print("Invalid choice.")
 
while True:
    main()