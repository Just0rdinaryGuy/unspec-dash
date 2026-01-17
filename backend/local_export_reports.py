
import psycopg2
import json
from datetime import date, datetime

# Config Local
DB_CONFIG = {
    "dbname": "gpon_network",
    "user": "gpon_user",
    "password": "gpon_secure_pass_2026",
    "host": "localhost",
    "port": "5432"
}

def json_serial(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def export_data():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Select all daily reports
        cur.execute("SELECT date, total_saldo, close, saldo_lama, target FROM daily_reports ORDER BY date")
        rows = cur.fetchall()
        
        data = []
        for row in rows:
            data.append({
                "date": row[0],
                "total_saldo": row[1],
                "close": row[2],
                "saldo_lama": row[3],
                "target": row[4]
            })
            
        print(f"Found {len(data)} records.")
        
        # Save to file
        with open("migration_reports.json", "w") as f:
            json.dump(data, f, default=json_serial, indent=2)
            
        print("Export successful: migration_reports.json")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    export_data()
