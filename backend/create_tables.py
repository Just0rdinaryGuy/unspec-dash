from database import engine, Base, NetworkNodeDB, UserDB
from models.report import DailyReportDB
from models.team import TeamDB

# Import all models to ensure they are registered with Base metadata
print("Registering models...")

def create_tables():
    print("Creating tables in database...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully.")

if __name__ == "__main__":
    create_tables()
