from storage import preferences

from storage import preferences, save_preferences

def update_preference(category, option):
    preferences[category][option] += 1
    save_preferences(preferences)
    
def rank_options(category):
    options = preferences[category]
    ranked = sorted(options.items(), key=lambda x: x[1], reverse=True)
    return ranked