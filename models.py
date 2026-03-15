from pydantic import BaseModel

class Reminder(BaseModel):
    id: int
    title: str
    category: str
    scheduled_time: str
    priority: int

