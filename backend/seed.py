from database import SessionLocal, UserDB, init_db
from models.team import TeamDB
from models.attendance import AttendanceDB
from services.auth_service import AuthService
import sys
def seed_admin():
    db = SessionLocal()
    try:
        # Check if developer exists
        dev = db.query(UserDB).filter(UserDB.username == "Just0rdinaryGuy").first()
        if dev:
            print("Developer user sudah ada")
        else:
            print("Membuat developer user...")
            dev_pwd = AuthService.get_password_hash("W0rld0nF!re")
            developer = UserDB(
                username="Just0rdinaryGuy",
                nik="000000",
                password_hash=dev_pwd,
                full_name="Just0rdinaryGuy",
                role="developer",
                is_active=True
            )
            db.add(developer)
            db.commit()
            print("✓ Developer user created (username: Just0rdinaryGuy)")

    except Exception as e:
        print(f"Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    seed_admin()
