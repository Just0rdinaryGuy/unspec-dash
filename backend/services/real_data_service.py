"""
Service buat query data real dari database
Ganti mock DataGenerator yang lama
"""
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
import pandas as pd
import pytz
import io # buat export Excel
from models.network import (
    NetworkNode, NetworkSummary, HVCDistribution, 
    StatusKurma, ODPInfo, FilterOptions
)
from database import NetworkNodeDB # import database
from models.ticket import ServiceTicket, TicketSummary
from models.report import DailyReportDB # import model report
import random


class RealDataService:
    """Service layer buat query data real dari database"""
    
    def __init__(self, db: Session):
        self.db = db

    def generate_daily_report(self, target_date: date, target: int = 127) -> DailyReportDB:
        """
        Generate laporan harian otomatis buat tanggal tertentu
        """
        print(f"Generating Report for {target_date}...")
        
        # 1. Hitung Total Saldo (semua tiket, ga peduli statusnya apa)
        total_tickets_count = self.db.query(NetworkNodeDB).filter(
            func.date(NetworkNodeDB.import_date) == target_date
        ).count()
        
        # 2. Hitung yang udah Close
        # pake or_ buat handle kalo ada beda-beda dikit penulisannya
        closed_count = self.db.query(NetworkNodeDB).filter(
            func.date(NetworkNodeDB.import_date) == target_date,
            or_(NetworkNodeDB.ticket_status == 'CLOSED', NetworkNodeDB.ticket_status == 'Close')
        ).count()
        
        # 3. Hitung Saldo Lama (sisa yang belum closed)
        # "saldo lama adalah sisa dari total saldo yang belum terbaca closed"
        # Termasuk PROGRESS, KENDALA
        saldo_lama = total_tickets_count - closed_count

        
        # Cek udah ada belum
        report = self.db.query(DailyReportDB).filter(DailyReportDB.date == target_date).first()
        
        if report:
             # Update yang udah ada
             report.total_saldo = total_tickets_count
             report.close = closed_count
             report.saldo_lama = saldo_lama
             report.target = target
        else:
             # Bikin baru
             report = DailyReportDB(
                date=target_date,
                total_saldo=total_tickets_count,
                close=closed_count,
                saldo_lama=saldo_lama,
                target=target
             )
             self.db.add(report)
             
        self.db.commit()
        self.db.refresh(report)
        print(f"Report Generated: Total={total_tickets_count}, Close={closed_count}")
        return report
        
    def _parse_float(self, val: Any) -> Optional[float]:
        """Helper buat parse float aman dan normalisasi satuan"""
        try:
            if val is None:
                return None
            f_val = float(val)
            # Fix value integer mentah (contoh: -30456 -> -30.456)
            # Asumsi: power GPON biasanya antara -10 sampai -40
            # Kalo nilai terlalu gede (< -100), asumsi perlu scaling
            if f_val < -100:
                return f_val / 1000.0
            return f_val
        except:
            return None
            
    def _is_spec(self, row: Dict[str, Any]) -> bool:
        """Helper buat tentuin status SPEC"""
        # Logic sama kayak determine_spec_status dari excel_import.py
        # Range SPEC: -13.5 sampai -24.89
        SPEC_MIN = -24.89
        SPEC_MAX = -13.5
        ERROR_CODES = [-500, -501, -502, -503, -504]
        
        val = self._parse_float(row.get('UKUR ULANG'))
        
        if val is None or val in ERROR_CODES:
            return False # UNSPEC
            
        if val > SPEC_MAX or val < SPEC_MIN:
            return False # UNSPEC
            
        return True # SPEC
        
    def _determine_hvc(self, row: Dict[str, Any]) -> str:
        """Helper to determine HVC category"""
        hvc = str(row.get('FLAG HVC', '')).strip().upper()
        if 'DIAMOND' in hvc: return 'HVC_DIAMOND'
        if 'GOLD' in hvc: return 'HVC_GOLD'
        if 'PLATINUM' in hvc: return 'HVC_PLATINUM'
        return 'Regular'
    
    def get_network_nodes(
        self,
        skip: int = 0,
        limit: int = 50,
        sto: Optional[str] = None,
        sector: Optional[str] = None,
        spec_status: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[NetworkNode], int]:
        """
        Get paginated network nodes dengan filtering
        
        Returns:
            Tuple of (nodes_list, total_count)
        """
        # Build query
        query = self.db.query(NetworkNodeDB)
        
        # Apply filters
        # Force Latest Date (Fix "Total 1.022" issue)
        # Assuming Data Explorer always wants Latest Snapshot unless specified (but router doesn't support date yet)
        latest = self._get_latest_date()
        target_date = latest.date() if latest else None
        
        if target_date:
            query = query.filter(func.date(NetworkNodeDB.import_date) == target_date)

        if sto and sto != "ALL":
            # Handle multiple STO (comma separated)
            if "," in sto:
                sto_list = [s.strip() for s in sto.split(",") if s.strip()]
                query = query.filter(NetworkNodeDB.sto.in_(sto_list))
            else:
                query = query.filter(NetworkNodeDB.sto == sto)
        
        if sector:
            query = query.filter(NetworkNodeDB.sector == sector)
        
        if spec_status:
            query = query.filter(NetworkNodeDB.spec_status == spec_status.upper())
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (NetworkNodeDB.nd.like(search_pattern)) | 
                (NetworkNodeDB.odp.like(search_pattern))
            )
        
        # Get total count before pagination
        total = query.count()
        
        # Apply pagination
        db_nodes = query.offset(skip).limit(limit).all()
        
        # Convert to Pydantic models
        nodes = []
        for db_node in db_nodes:
            node = NetworkNode(
                id=db_node.id,
                node_id=db_node.node_id or "",  # Added node_id
                port=db_node.port or "",
                nd=db_node.nd or "",
                status="ONLINE",  # Simplified - bisa expand later
                rx_power=db_node.rx_power_after or 0.0,
                sto=db_node.sto or "",
                sector=db_node.sector or "",
                odp=db_node.odp or "",
                hvc_category=db_node.hvc_category or "Regular",
                spec_status=db_node.spec_status or "UNSPEC"
            )
            nodes.append(node)
        
        return nodes, total
    
    
    def _get_latest_date(self):
        """Get the latest import date from the database"""
        # We need to filter by DATE part only if multiple imports happen same day (though import_data clears day)
        # But safest is MAX(import_date)
        return self.db.query(func.max(NetworkNodeDB.import_date)).scalar()

    def get_dashboard_summary(self) -> NetworkSummary:
        """Get dashboard summary statistics for LATEST DATE only"""
        
        latest_date = self._get_latest_date()
        if not latest_date:
            return NetworkSummary(
                total_hvc={"diamond":0,"gold":0,"platinum":0,"regular":0,"total":0},
                network_health={"spec":0,"unspec":0,"spec_count":0,"unspec_count":0,"total_nodes":0},
                ticket_status={"open":0,"closed":0,"total":0}
            )
            
        # Target date for filtering (truncated to date if needed, but import_date is usually timestamp)
        # Actually import_data sets distinct timestamps per import batch?
        # Yes, let's filter by the exact max timestamp or just date?
        # import_data deletes by `func.date`. So querying by `func.date` is safer.
        target_date = latest_date.date()
        
        # Base Query Filter
        def apply_date_filter(q):
            return q.filter(func.date(NetworkNodeDB.import_date) == target_date)

        # Total nodes
        total_nodes = apply_date_filter(self.db.query(NetworkNodeDB)).count()
        
        # SPEC/UNSPEC counts
        spec_count = apply_date_filter(self.db.query(NetworkNodeDB).filter(
            NetworkNodeDB.spec_status == "SPEC"
        )).count()
        unspec_count = total_nodes - spec_count
        
        # HVC distribution
        hvc_counts = apply_date_filter(self.db.query(
            NetworkNodeDB.hvc_category,
            func.count(NetworkNodeDB.id)
        )).group_by(NetworkNodeDB.hvc_category).all()
        
        hvc_dict = {hvc: count for hvc, count in hvc_counts}
        
        # Ticket stats (from ticket_status)
        closed_tickets = apply_date_filter(self.db.query(NetworkNodeDB).filter(
            NetworkNodeDB.ticket_status == "CLOSED"
        )).count()
        open_tickets = total_nodes - closed_tickets
        
        # Calculate network health percentage
        network_health_pct = round((spec_count / total_nodes * 100) if total_nodes > 0 else 0, 2)
        unspec_pct = round((unspec_count / total_nodes * 100) if total_nodes > 0 else 0, 2)
        
        # Calculate HVC totals
        diamond_count = hvc_dict.get("HVC_DIAMOND", 0)
        gold_count = hvc_dict.get("HVC_GOLD", 0)
        platinum_count = hvc_dict.get("HVC_PLATINUM", 0)
        # Regular bisa ada sebagai: Regular, REGULAR, atau REGULER (dari data Excel)
        regular_count = hvc_dict.get("Regular", 0) + hvc_dict.get("REGULAR", 0) + hvc_dict.get("REGULER", 0)
        
        return NetworkSummary(
            total_hvc={
                "diamond": diamond_count,
                "gold": gold_count,
                "platinum": platinum_count,
                "regular": regular_count,
                "total": diamond_count + gold_count + platinum_count + regular_count
            },
            network_health={
                "spec": network_health_pct,
                "unspec": unspec_pct,
                "spec_count": spec_count,
                "unspec_count": unspec_count,
                "total_nodes": total_nodes
            },
            ticket_status={
                "open": open_tickets,
                "closed": closed_tickets,
                "total": total_nodes
            }
        )
    
    def get_hvc_pivot(self) -> List[HVCDistribution]:
        """Get HVC distribution per STO for LATEST DATE"""
        
        latest_date = self._get_latest_date()
        if not latest_date:
            return []
            
        target_date = latest_date.date()
        
        # Group by STO and HVC category
        results = self.db.query(
            NetworkNodeDB.sto,
            NetworkNodeDB.hvc_category,
            func.count(NetworkNodeDB.id)
        ).filter(
            func.date(NetworkNodeDB.import_date) == target_date
        ).group_by(
            NetworkNodeDB.sto,
            NetworkNodeDB.hvc_category
        ).all()
        
        # Aggregate by STO
        sto_data = {}
        for sto, hvc, count in results:
            if sto not in sto_data:
                sto_data[sto] = {"diamond": 0, "gold": 0, "platinum": 0, "regular": 0}
            
            if hvc == "HVC_DIAMOND":
                sto_data[sto]["diamond"] += count
            elif hvc == "HVC_GOLD":
                sto_data[sto]["gold"] += count
            elif hvc == "HVC_PLATINUM":
                sto_data[sto]["platinum"] += count
            else:
                sto_data[sto]["regular"] += count
        
        # Convert to list
        pivot_list = []
        for sto, counts in sto_data.items():
            total = sum(counts.values())
            pivot_list.append(HVCDistribution(
                sto=sto,
                diamond=counts["diamond"],
                gold=counts["gold"],
                platinum=counts["platinum"],
                regular=counts["regular"],
                grand_total=total  # Changed from total to grand_total
            ))
        
        return sorted(pivot_list, key=lambda x: x.sto)
    
    def get_status_kurma(self) -> List[StatusKurma]:
        """Get SPEC/UNSPEC distribution per STO for LATEST DATE"""
        latest_date = self._get_latest_date()
        if not latest_date:
            return []
        
        target_date = latest_date.date()
        
        results = self.db.query(
            NetworkNodeDB.sto,
            NetworkNodeDB.spec_status,
            func.count(NetworkNodeDB.id)
        ).filter(
            func.date(NetworkNodeDB.import_date) == target_date
        ).group_by(
            NetworkNodeDB.sto,
            NetworkNodeDB.spec_status
        ).all()
        
        # Aggregate
        sto_data = {}
        for sto, status, count in results:
            if sto not in sto_data:
                sto_data[sto] = {"spec": 0, "unspec": 0}
            
            if status == "SPEC":
                sto_data[sto]["spec"] += count
            else:
                sto_data[sto]["unspec"] += count
        
        # Convert to list
        kurma_list = []
        for sto, counts in sto_data.items():
            total = counts["spec"] + counts["unspec"]
            kurma_list.append(StatusKurma(
                sto=sto,
                spec=counts["spec"],
                unspec=counts["unspec"],
                grand_total=total  # Changed from total to grand_total
            ))
        
        return sorted(kurma_list, key=lambda x: x.sto)
    
    def get_odp_list(self, limit: int = 50) -> List[ODPInfo]:
        """
        Get ODP summary list with smart clustering
        
        Logic:
        - Group by ODP name if available
        - If ODP is empty/nan, group by Node ID + Port range (shelf|slot|port - first 3 segments)
        - Only show groups with > 1 subscriber (clustering purpose)
        """
        
        latest_date = self._get_latest_date()
        if not latest_date:
            return []
            
        target_date = latest_date.date()
        
        # Query all nodes with their ODP, Node ID, and Port for LATEST DATE
        results = self.db.query(
            NetworkNodeDB.odp,
            NetworkNodeDB.node_id,
            NetworkNodeDB.port,
            NetworkNodeDB.sto,
            NetworkNodeDB.sector,
            NetworkNodeDB.spec_status,
            func.count(NetworkNodeDB.id)
        ).filter(
            func.date(NetworkNodeDB.import_date) == target_date
        ).group_by(
            NetworkNodeDB.odp,
            NetworkNodeDB.node_id,
            NetworkNodeDB.port,
            NetworkNodeDB.sto,
            NetworkNodeDB.sector,
            NetworkNodeDB.spec_status
        ).all()
        
        # Helper function to extract port range (first 3 segments: shelf|slot|port)
        def get_port_range(port_str):
            if not port_str:
                return "UNKNOWN"
            parts = str(port_str).split("|")
            if len(parts) >= 3:
                return "|".join(parts[:3])  # shelf|slot|port
            return port_str
        
        # Aggregate: use node_id + port range as fallback when odp is empty
        grouped_data = {}
        for odp, node_id, port, sto, sector, status, count in results:
            # Determine grouping key
            if not odp or odp == "nan" or str(odp).strip() == "":
                # Group by node_id + port range when ODP is missing
                port_range = get_port_range(port)
                group_key = f"NODE:{node_id}|PORT:{port_range}"
                display_name = f"{node_id or 'Unknown'} (Port: {port_range})"
            else:
                # Group by ODP name
                group_key = f"ODP:{odp}"
                display_name = odp
            
            # Create composite key with STO and sector
            full_key = (group_key, sto, sector)
            
            if full_key not in grouped_data:
                grouped_data[full_key] = {
                    "display_name": display_name,
                    "spec": 0,
                    "unspec": 0
                }
            
            if status == "SPEC":
                grouped_data[full_key]["spec"] += count
            else:
                grouped_data[full_key]["unspec"] += count
        
        # Convert to list and filter: only show if total > 1 AND has UNSPEC nodes
        odp_list = []
        for (group_key, sto, sector), counts in grouped_data.items():
            total = counts["spec"] + counts["unspec"]
            
            # Skip if only 1 subscriber (not a cluster)
            if total <= 1:
                continue
            
            # Skip if no UNSPEC nodes (user wants UNSPEC only)
            if counts["unspec"] == 0:
                continue
            
            odp_list.append(ODPInfo(
                odp_name=counts["display_name"],
                sto=sto or "",
                sector=sector or "",
                total_subscribers=total,
                spec_count=counts["spec"],
                unspec_count=counts["unspec"]
            ))
        # Sort by UNSPEC count descending (prioritas UNSPEC terbanyak)
        odp_list.sort(key=lambda x: x.unspec_count, reverse=True)
        
        return odp_list[:limit]
    
    def import_data(self, data: List[Dict[str, Any]], custom_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Import data from parsed Excel rows
        Replaces 'truncate' strategy with 'daily snapshot' strategy
        """
        if not data:
            return {"status": "error", "message": "No data allowed"}
            
        # Use custom date if provided, else today
        today = datetime.now().date()
        target_date = custom_date if custom_date else today
        
        # Timestamp for the rows (should use the target date + current time or midnight)
        # If backfilling, maybe use noon? Or just the date.
        # DB column is TIMESTAMP. Let's use datetime.combine(target_date, datetime.now().time())
        if custom_date:
            import_timestamp = datetime.combine(custom_date, datetime.now().time())
        else:
            import_timestamp = datetime.now()
            
        try:
            # 1. Delete existing data for TARGET DATE (snapshot replacement)
            # This allows re-uploading to correct today's data without losing history
            deleted = self.db.query(NetworkNodeDB).filter(
                func.date(NetworkNodeDB.import_date) == target_date
            ).delete(synchronize_session=False)
            
            # 2. Fix Sequence (CRITICAL FIX for Duplicate ID Error)
            # Postgres sequence might be out of sync if data was inserted manually or migrated
            try:
                from sqlalchemy import text
                # Reset sequence to MAX(id)
                self.db.execute(text(
                    "SELECT setval('network_nodes_id_seq', COALESCE((SELECT MAX(id) FROM network_nodes), 0) + 1, false);"
                ))
            except Exception as seq_err:
                print(f"Warning: Could not reset sequence (ignorable if not Postgres): {seq_err}")

            # 3. Bulk insert new data
            nodes_to_insert = []
            row_num = 1
            
            for row in data:
                # Basic fields
                node = NetworkNodeDB(
                    row_number=row_num,
                    sto=row.get('STO', 'UNMAP'),
                    sector=row.get('SEKTOR', 'UNMAP'),
                    nd=str(row.get('ND', '')),
                    odp=row.get('ODP', ''), # Use ODP/DP column
                    port=row.get('PORT', ''),
                    node_id=row.get('NODE ID', ''),
                    
                    # Specs
                    fiber_length=str(row.get('PANJANG TARIKAN', '')),
                    
                    # Power
                    rx_power_before=self._parse_float(row.get('ONU RX POWER')),
                    rx_power_after=self._parse_float(row.get('UKUR ULANG')),  # Assuming new measurement
                    
                    # Status & Categorization
                    spec_status="SPEC" if self._is_spec(row) else "UNSPEC",
                    ticket_status="CLOSED" if self._is_spec(row) else "PROGRESS", # UNSPEC = PROGRESS, SPEC = CLOSED
                    status_rfo="", # Default empty
                    nama_teknisi="", # Default empty (override DB default)
                    no_tiket="", # Default empty (override DB default)
                    
                    # Date Tracking
                    import_date=import_timestamp,
                    
                    # Customer Info
                    hvc_category=self._determine_hvc(row)
                )
                nodes_to_insert.append(node)
                row_num += 1
                
            # Batch insert
            self.db.bulk_save_objects(nodes_to_insert)
            self.db.commit()
            
            # Recalculate summary stats
            total_nodes = len(nodes_to_insert)
            spec_count = sum(1 for n in nodes_to_insert if n.spec_status == "SPEC")
            unspec_count = total_nodes - spec_count
            
            # Return timestamp in WITA timezone (UTC+8) - add 8 hours manually
            from datetime import timedelta
            wita_now = datetime.now() + timedelta(hours=8)
            
            return {
                "status": "success", 
                "message": f"Successfully imported {total_nodes} rows for {import_timestamp.date()}",
                "summary": {
                    "total_imported": total_nodes,
                    "spec_count": spec_count,
                    "unspec_count": unspec_count,
                    "deleted_prev_today": deleted,
                    "timestamp": wita_now.isoformat()
                }
            }
            
        except Exception as e:
            self.db.rollback()
            print(f"Error saving to database: {e}")
            raise e

    def update_redaman_values(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Update ONLY redaman values based on Ukur Massal data.
        Does NOT delete or insert new rows.
        Updates rx_power_after (Redaman Akhir) for matching NDs.
        """
        if not data:
             return {"status": "error", "message": "No data to update"}
             
        updated_count = 0
        not_found_count = 0
        
        try:
            for row in data:
                nd = str(row.get("ND", "")).strip()
                val_raw = row.get("UKUR_ULANG")
                
                if not nd:
                    continue
                    
                # Parse float
                rx_val = self._parse_float(val_raw)
                
                if rx_val is None:
                    continue
                    
                # Find node by ND (most recent or all? Logic: update all matching NDs for today/latest)
                # Ideally specific to current context, but usually ND is unique per upload set.
                # Use simple filter
                nodes = self.db.query(NetworkNodeDB).filter(NetworkNodeDB.nd == nd).all()
                
                if not nodes:
                    not_found_count += 1
                    continue
                    
                for node in nodes:
                    node.rx_power_after = rx_val
                    # Recalculate status if needed?
                    # Yes, if power changes, status might change.
                    # But if we update redaman, it usually means we measured it again.
                    # We should probably update spec_status.
                    
                    # Determine SPEC/UNSPEC based on NEW value
                    SPEC_MIN = -24.89
                    SPEC_MAX = -13.5
                    is_spec = False
                    if SPEC_MIN <= rx_val <= SPEC_MAX:
                        is_spec = True
                    
                    node.spec_status = "SPEC" if is_spec else "UNSPEC"
                    
                    # Update ticket status if it became SPEC
                    if is_spec:
                         node.ticket_status = "CLOSED"
                    
                    updated_count += 1
            
            self.db.commit()
            
            
            # Return timestamp in WITA timezone (UTC+8) - add 8 hours manually
            from datetime import timedelta
            wita_now = datetime.now() + timedelta(hours=8)
            
            return {
                "status": "success",
                "message": f"Updated redaman for {updated_count} nodes",
                "summary": {
                    "updated_nodes": updated_count,
                    "not_found": not_found_count,
                    "timestamp": wita_now.isoformat()
                }
            }
            
        except Exception as e:
            self.db.rollback()
            raise e
    
    def get_filter_options(self):
        """Get unique filter options"""
        stos = self.db.query(NetworkNodeDB.sto).distinct().order_by(NetworkNodeDB.sto).all()
        sectors = self.db.query(NetworkNodeDB.sector).distinct().order_by(NetworkNodeDB.sector).all()
        
        return {
            "sto": [s[0] for s in stos if s[0]],
            "sector": [s[0] for s in sectors if s[0]],
            "spec_status": ["SPEC", "UNSPEC"],
            "hvc_category": ["HVC_DIAMOND", "HVC_GOLD", "HVC_PLATINUM", "REGULAR"]
        }
        
    def get_service_recovery_tickets(
        self,
        status: Optional[str] = None,
        sto: Optional[str] = None,
        date_filter: Optional[date] = None,
        spec_status: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        sort_by: Optional[str] = None,
        sort_order: str = "asc",
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get service recovery tickets with pagination and filtering"""
        query = self.db.query(NetworkNodeDB)
        
        # Date Filter Logic: Default to Latest if None
        if date_filter:
            target_date = date_filter
        else:
             latest = self._get_latest_date()
             target_date = latest.date() if latest else None
        
        if target_date:
            query = query.filter(func.date(NetworkNodeDB.import_date) == target_date)
            
        if date_filter:
            target_date = date_filter
        else:
            # Default to latest date if not specified (Data Explorer behavior)
            latest = self._get_latest_date()
            target_date = latest.date() if latest else None
            
        if target_date:
            query = query.filter(func.date(NetworkNodeDB.import_date) == target_date)
        
        # Apply filters
        # STO handled
        if sto and sto != "ALL":
             # Handle multiple STO (comma separated)
            if "," in sto:
                sto_list = [s.strip() for s in sto.split(",") if s.strip()]
                query = query.filter(NetworkNodeDB.sto.in_(sto_list))
            else:
                query = query.filter(NetworkNodeDB.sto == sto)
                
        # Status Filter - Handle "ALL" explicit check
        if status and status.upper() != "ALL":
            query = query.filter(NetworkNodeDB.ticket_status == status)
        
        # SPEC Status Filter
        if spec_status and spec_status.upper() != "ALL":
            query = query.filter(NetworkNodeDB.spec_status == spec_status.upper())
            
        # Search (ND or ODP)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (NetworkNodeDB.nd.like(search_pattern)) | 
                (NetworkNodeDB.odp.like(search_pattern))
            )
            
        # Total Count (before pagination)
        total_count = query.count()
        
        # Sorting
        if sort_by:
            # Field mapping Frontend -> Backend DB Column
            sort_mapping = {
                "tgl": NetworkNodeDB.import_date,
                "sto": NetworkNodeDB.sto,
                "nd": NetworkNodeDB.nd,
                "node_id": NetworkNodeDB.node_id,
                "odp": NetworkNodeDB.odp,
                "nama_teknisi": NetworkNodeDB.nama_teknisi,
                "no_tiket": NetworkNodeDB.no_tiket,
                "redaman_awal": NetworkNodeDB.rx_power_before,
                "redaman_akhir": NetworkNodeDB.rx_power_after,
                "hvc_category": NetworkNodeDB.hvc_category,
                "status_rfo": NetworkNodeDB.status_rfo,
                "ticket_status": NetworkNodeDB.ticket_status
            }
            
            sort_column = sort_mapping.get(sort_by)
            if sort_column is not None:
                if sort_order == "desc":
                    query = query.order_by(sort_column.desc())
                else:
                    query = query.order_by(sort_column.asc())
        else:
             # Default sort by ID desc (newest first)
            query = query.order_by(NetworkNodeDB.id.desc())

        # Pagination
        offset = (page - 1) * limit
        nodes = query.limit(limit).offset(offset).all()
        
        tickets = []
        for node in nodes:
            tickets.append(ServiceTicket(
                id=node.id,
                tgl=node.import_date.date() if node.import_date else date.today(),
                sto=node.sto or "-",
                odp=node.odp or "-",
                nama_teknisi=node.nama_teknisi or "", # Empty by default
                no_tiket=node.no_tiket or "", # Empty by default
                redaman_awal=node.rx_power_before if node.rx_power_before is not None else 0,
                redaman_akhir=node.rx_power_after, # Always show value if exists
                status_rfo=node.status_rfo or "", # Empty by default
                ticket_status=node.ticket_status or "OPEN",
                hvc_category=node.hvc_category or "Regular",
                nd=node.nd,
                node_id=node.node_id,
                keterangan=f"Port: {node.port}"
            ))
            
        return {
            "items": tickets,
            "total": total_count,
            "page": page,
            "limit": limit
        }

    def get_ticket_summary(self) -> TicketSummary:
        """Get ticket summary statistics for LATEST DATE"""
        
        latest_date = self._get_latest_date()
        if not latest_date:
             return TicketSummary(
                total_tickets=0, total_open=0, total_progress=0, 
                total_close=0, total_kendala=0, avg_resolution_time=None
            )
            
        target_date = latest_date.date()
        
        def apply_date_filter(q):
            return q.filter(func.date(NetworkNodeDB.import_date) == target_date)

        # New Definitions:
        # OPEN: 'OPEN', 'SISA TIKET'
        # PROGRESS: 'PROGRESS'
        # KENDALA: 'KENDALA'
        # CLOSED: 'CLOSED'
        
        total_open = apply_date_filter(self.db.query(NetworkNodeDB).filter(
            NetworkNodeDB.ticket_status.in_(["OPEN", "SISA TIKET"])
        )).count()
        
        total_progress = apply_date_filter(self.db.query(NetworkNodeDB).filter(NetworkNodeDB.ticket_status == "PROGRESS")).count()
        total_kendala = apply_date_filter(self.db.query(NetworkNodeDB).filter(NetworkNodeDB.ticket_status == "KENDALA")).count()
        total_closed = apply_date_filter(self.db.query(NetworkNodeDB).filter(NetworkNodeDB.ticket_status == "CLOSED")).count()
        
        # Calculate total tickets
        total_tickets = total_open + total_progress + total_kendala + total_closed
        
        return TicketSummary(
            total_tickets=total_tickets,
            total_open=total_open,
            total_progress=total_progress,
            total_close=total_closed,
            total_kendala=total_kendala,
            avg_resolution_time=None
        )
    
    def export_all_nodes(
        self,
        sto: Optional[str] = None,
        sector: Optional[str] = None,
        spec_status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[NetworkNode]:
        """Export all nodes (for CSV download) with filters"""
        
        nodes, _ = self.get_network_nodes(
            skip=0,
            limit=10000,  # Large limit for export
            sto=sto,  # Will handle comma separated automatically inside get_network_nodes
            sector=sector,
            spec_status=spec_status,
            search=search
        )
        
        return nodes


    def get_available_dates(self) -> List[date]:
        """Get list of available import dates"""
        dates = self.db.query(func.date(NetworkNodeDB.import_date)).distinct().order_by(desc(func.date(NetworkNodeDB.import_date))).all()
        return [d[0] for d in dates if d[0]]

    def export_service_recovery_tickets(
        self,
        status: Optional[str] = None, 
        search: Optional[str] = None
    ):
        """Export service recovery tickets to Excel matching the table format"""
        print(f"DEBUG EXPORT: Status={status}, STO={sto}, Date={date_filter}")
        query = self.db.query(NetworkNodeDB)
        
        if date_filter:
            target_date = date_filter
        else:
            # Default to latest date if not specified
            latest = self._get_latest_date()
            target_date = latest.date() if latest else None
            
        if target_date:
            query = query.filter(func.date(NetworkNodeDB.import_date) == target_date)
        
        # Filters
        if sto and sto != "ALL":
            if "," in sto:
                sto_list = [s.strip() for s in sto.split(",") if s.strip()]
                query = query.filter(NetworkNodeDB.sto.in_(sto_list))
            else:
                query = query.filter(NetworkNodeDB.sto == sto)
                
        if status and status.upper() != "ALL":
             query = query.filter(NetworkNodeDB.ticket_status == status)
             
        # Search (ND or ODP)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (NetworkNodeDB.nd.like(search_pattern)) | 
                (NetworkNodeDB.odp.like(search_pattern))
            )
             
        nodes = query.all()
        
        # Convert to list of dicts for DataFrame
        data = []
        for node in nodes:
            redaman_awal = node.rx_power_before if node.rx_power_before is not None else 0
            # Format redaman to string "X dB" or just float
            # Let's keep it as number for Excel calculation
            
            if len(data) < 5:
                print(f"DEBUG EXPORT NODE: ID={node.id}, Teknisi={node.nama_teknisi}, NoTiket={node.no_tiket}, HVC={node.hvc_category}")

            data.append({
                "Tanggal": node.import_date.date() if node.import_date else date.today(),
                "STO": node.sto,
                "ND": node.nd,
                "Node ID": node.node_id or "",
                "ODP": node.odp,
                "Teknisi": node.nama_teknisi or "",
                "No. Tiket": node.no_tiket or "",
                "Redaman Before (dB)": redaman_awal,
                "Redaman After (dB)": node.rx_power_after,
                "HVC Category": node.hvc_category or "Regular",
                "Status RFO": node.status_rfo or "",
                "Status Tiket": node.ticket_status or "OPEN",
                "Spec Status": node.spec_status # Extra useful col
            })
            
        return pd.DataFrame(data)

    def update_ticket(self, ticket_id: int, updates: Dict[str, Any]) -> Optional[ServiceTicket]:
        """Update ticket details"""
        node = self.db.query(NetworkNodeDB).filter(NetworkNodeDB.id == ticket_id).first()
        if not node:
            return None
            
        # Update allowed fields
        if "sto" in updates:
            node.sto = updates["sto"]
        if "nama_teknisi" in updates:
            node.nama_teknisi = updates["nama_teknisi"]
        if "no_tiket" in updates:
            node.no_tiket = updates["no_tiket"]
        if "odp" in updates:
            node.odp = updates["odp"]
        if "status_rfo" in updates:
            node.status_rfo = updates["status_rfo"]
        if "ticket_status" in updates:
            node.ticket_status = updates["ticket_status"]
            if node.ticket_status == "CLOSED":
                # Maybe set closed_at? Not in schema yet
                pass
                
        self.db.commit()
        self.db.refresh(node)
        
        # Return updated ticket object
        return ServiceTicket(
            id=node.id,
            tgl=node.import_date.date() if node.import_date else date.today(),
            sto=node.sto or "-",
            odp=node.odp or "-",
            nama_teknisi=node.nama_teknisi or "System",
            no_tiket=node.no_tiket or f"T-{node.id:05d}",
            redaman_awal=node.rx_power_before or node.rx_power_after or 0,
            redaman_akhir=node.rx_power_after if node.spec_status == "SPEC" else None,
            status_rfo=node.status_rfo or "OPEN",
            ticket_status=node.ticket_status or "OPEN",
            nd=node.nd,
            keterangan=f"Port: {node.port}"
        )

    def export_monthly_report(self, month: int, year: int) -> io.BytesIO:
        """
        Generate Excel with Chart and Raw Data Sheets
        Sheet 1: Report Summary + Chart
        Sheet 2: Data Unspec (Latest in Month)
        Sheet 3: Data Ukur Massal (All Nodes - Latest in Month)
        """
        
        # 1. Fetch Report Data
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
            
        reports = self.db.query(DailyReportDB).filter(
            DailyReportDB.date >= start_date,
            DailyReportDB.date < end_date
        ).order_by(DailyReportDB.date).all()
        
        data_report = []
        for r in reports:
            data_report.append({
                "Date": r.date,
                "Total Saldo": r.total_saldo,
                "Close": r.close,
                "Saldo Lama": r.saldo_lama,
                "Target": r.target
            })
            
        df_report = pd.DataFrame(data_report)
        
        # 2. Fetch Latest Raw Data Step
        # Find latest import date within this month
        latest_import = self.db.query(func.max(NetworkNodeDB.import_date)).filter(
            NetworkNodeDB.import_date >= start_date,
            NetworkNodeDB.import_date < end_date
        ).scalar()
        
        raw_nodes = []
        if latest_import:
            # Fetch ALL nodes for that date
            nodes_query = self.db.query(NetworkNodeDB).filter(
                func.date(NetworkNodeDB.import_date) == latest_import.date()
            ).all()
            
            for n in nodes_query:
                raw_nodes.append({
                    "NODE ID": n.node_id,
                    "ND": n.nd,
                    "STO": n.sto,
                    "SEKTOR": n.sector,
                    "ODP": n.odp,
                    "PORT": n.port,
                    "PANJANG TARIKAN": n.fiber_length,
                    "STATUS": n.spec_status,
                    "ONU RX POWER": n.rx_power_before,
                    "UKUR ULANG": n.rx_power_after,
                    "TEKNISI": n.nama_teknisi,
                    "NO TIKET": n.no_tiket
                })
        
        # 3. Prepare DataFrames
        df_raw = pd.DataFrame(raw_nodes)
        
        if df_raw.empty:
            df_unspec = pd.DataFrame()
            df_ukur = pd.DataFrame()
        else:
            # Common Logic: Map basic cols first if needed, but df_raw already hasmapped keys
            # Wait, raw_nodes keys are already UPPERCASE from previous step.
            
            # Target Columns from ukurmassal.xlsx (Apply to BOTH sheets for consistency)
            target_cols = [
                'NO', 'STO', 'SEKTOR', 'ND', 'ODP', 'PORT', 'NODE ID', 
                'PANJANG TARIKAN', 'ONU RX POWER', 'UKUR ULANG', 
                'Keterangan', 'Check Status', 'Result', 'Nas IP Address (IP BRAS)'
            ]

            # Sheet 2: Data Unspec (ALL 514 Rows - Report Format)
            # Use columns similar to Sheet 1 or Standard Report
            df_unspec = df_raw[[
                "NODE ID", "ND", "STO", "SEKTOR", "ODP", "PORT", 
                "STATUS", "ONU RX POWER", "UKUR ULANG", "TEKNISI", "NO TIKET"
            ]].copy()
            # Rename for display aesthetics if needed, or keep UPPERCASE since mapped
            
            # Sheet 3: Data Ukur Massal (ALL 514 Rows - Upload Format)
            # Strictly matches "Uploaded File" columns
            # Using df_raw directly (since it has 514 rows and is verified to be the universe)
            # Filter logic: df_measured_raw = df_raw[df_raw["UKUR ULANG"].notna()].copy()
            # But since notna is True for all, it is effectively df_raw.
            df_measured_raw = df_raw # Use All Data
            
            # Target Columns from ukurmassal.xlsx
            target_cols = [
                'NO', 'STO', 'SEKTOR', 'ND', 'ODP', 'PORT', 'NODE ID', 
                'PANJANG TARIKAN', 'ONU RX POWER', 'UKUR ULANG', 
                'Keterangan', 'Check Status', 'Result', 'Nas IP Address (IP BRAS)'
            ]

            # Enriched DataFrame builder for Sheet 3
            def build_export_df(source_df):
                df_out = source_df.copy()
                df_out['NO'] = range(1, len(df_out) + 1)
                df_out['Keterangan'] = "" 
                df_out['Check Status'] = ""
                df_out['Result'] = df_out['STATUS']
                df_out['Nas IP Address (IP BRAS)'] = ""
                
                for col in target_cols:
                    if col not in df_out.columns:
                        df_out[col] = "" # Fallback
                return df_out[target_cols]

            df_ukur = build_export_df(df_measured_raw)

        # Indonesian Month Names
        ID_MONTHS = [
            "", "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
            "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
        ]
        month_name = ID_MONTHS[month] if 1 <= month <= 12 else str(month)

        # 3. Write Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            # --- Sheet 1: Report & Chart ---
            df_report.to_excel(writer, sheet_name='Report', index=False)
            
            workbook = writer.book
            worksheet = writer.sheets['Report']
            
            if not df_report.empty:
                # Create Chart
                chart = workbook.add_chart({'type': 'column'})
                
                # Dynamic Range
                max_row = len(df_report) + 1
                
                # Series 1: Total Saldo
                chart.add_series({
                    'name':       ['Report', 0, 1], # B1 "Total Saldo"
                    'categories': ['Report', 1, 0, max_row, 0], # A2:A... Date
                    'values':     ['Report', 1, 1, max_row, 1], # B2:B... Values
                    'gap':        30,
                    'data_labels': {'value': True, 'font': {'size': 9}}
                })
                
                # Series 2: Close
                chart.add_series({
                    'name':       ['Report', 0, 2],
                    'categories': ['Report', 1, 0, max_row, 0],
                    'values':     ['Report', 1, 2, max_row, 2],
                    'data_labels': {'value': True, 'font': {'size': 9}}
                })
                
                # Series 3: Target (Line)
                chart.add_series({
                    'name':       ['Report', 0, 4], # E1 Target
                    'categories': ['Report', 1, 0, max_row, 0],
                    'values':     ['Report', 1, 4, max_row, 4], # E2:E...
                    'type':       'line',
                    'line':       {'color': 'red', 'dash_type': 'dash'},
                })
                
                # Title: SALDO UNSPEC BALIKPAPAN [MONTH] [YEAR]
                chart.set_title ({'name': f'SALDO UNSPEC BALIKPAPAN {month_name} {year}'})
                chart.set_x_axis({'name': 'Date'})
                chart.set_y_axis({'name': 'Count'})
                chart.set_size({'width': 960, 'height': 500})
                
                worksheet.insert_chart('G2', chart)
            
            # --- Sheet 2: Unspec Semesta ---
            df_unspec.to_excel(writer, sheet_name='Data Unspec', index=False)
            
            # --- Sheet 3: Ukur Massal (All) ---
            df_ukur.to_excel(writer, sheet_name='Data Ukur Massal', index=False)
            
        output.seek(0)
        return output
