from database import engine
from sqlalchemy import text

def run_migration():
    print("Otw Migrasi Phase 2...")
    
    with engine.connect() as conn:
        conn = conn.execution_options(isolation_level="AUTOCOMMIT")
        
        # 1. Bikin tabel Teams
        # Pake raw SQL biar yakin jalan di segala kondisi darurat.
        print("Checking/Creating 'teams' table...")
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS teams (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR UNIQUE,
                    sto VARCHAR,
                    leader_id INTEGER,
                    created_at TIMESTAMP WITHOUT TIME ZONE,
                    FOREIGN KEY(leader_id) REFERENCES users(id)
                );
            """))
            print("✓ Table 'teams' ensured.")
        except Exception as e:
            print(f"⚠ Error creating teams table: {e}")

        # 2. Update tabel Users
        print("Nambahin kolom Telegram di tabel users...")
        
        # Add chat_id
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN chat_id BIGINT UNIQUE;"))
            print("✓ Added column 'chat_id'")
        except Exception as e:
            if "already exists" in str(e):
                print("✓ Column 'chat_id' already exists")
            else:
                print(f"⚠ Error adding chat_id: {e}")

        # Add telegram_username
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN telegram_username VARCHAR;"))
            print("✓ Added column 'telegram_username'")
        except Exception as e:
            if "already exists" in str(e):
                print("✓ Column 'telegram_username' already exists")
            else:
                 print(f"⚠ Error adding telegram_username: {e}")

        # Add team_id
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN team_id INTEGER REFERENCES teams(id);"))
            print("✓ Added column 'team_id'")
        except Exception as e:
            if "already exists" in str(e):
                print("✓ Column 'team_id' already exists")
            else:
                 print(f"⚠ Error adding team_id: {e}")

    print("Migrasi Phase 2 Kelar Bosku.")

if __name__ == "__main__":
    run_migration()
