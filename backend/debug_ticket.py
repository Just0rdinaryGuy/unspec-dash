from database import SessionLocal, NetworkNodeDB
import sys

def check_ticket(ticket_id):
    db = SessionLocal()
    try:
        print(f"Checking ticket {ticket_id}...")
        node = db.query(NetworkNodeDB).filter(NetworkNodeDB.id == ticket_id).first()
        if node:
            print(f"ID: {node.id}")
            print(f"ND: {node.nd}")
            print(f"Teknisi: {node.nama_teknisi}")
            print(f"No Tiket: {node.no_tiket}")
            print(f"Status RFO: {node.status_rfo}")
            print(f"Ticket Status: {node.ticket_status}")
            print(f"HVC: {node.hvc_category}")
        else:
            print("Ticket not found")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        check_ticket(int(sys.argv[1]))
    else:
        print("Usage: python debug_ticket.py <ticket_id>")
