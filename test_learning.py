from learning import update_preference, rank_options

print("Before Learning:")
print(rank_options("Fitness"))

update_preference("Fitness", "7_PM")
update_preference("Fitness", "7_PM")
update_preference("Fitness", "1_hour")

print("\nAfter learning:")
print(rank_options("Fitness"))

