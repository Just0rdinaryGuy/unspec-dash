from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class NetworkNode(BaseModel):
    """Model buat data node jaringan dari OLT"""
    id: Optional[int] = None
    node_id: Optional[str] = Field(None, description="NODE ID (IP OLT)")
    port: str = Field(..., description="Port OLT")
    nd: str = Field(..., description="Subscriber ID / ND")
    status: str = Field(..., description="Status koneksi: ONLINE, OFFLINE, KENDALA")
    rx_power: float = Field(..., description="Redaman/attenuation dalam dB")
    sto: str = Field(..., description="STO (sentral telepon otomat)")
    sector: str = Field(..., description="Sektor area")
    odp: str = Field(..., description="ODP (Optical Distribution Point)")
    hvc_category: Optional[str] = Field(None, description="Kategori HVC: Diamond, Gold, Platinum, Regular")
    spec_status: Optional[str] = Field(None, description="Hitung otomatis: SPEC atau UNSPEC")
    
    # Field tambahan buat keperluan monitoring
    olt_name: Optional[str] = None
    frame_slot: Optional[str] = None
    onu_type: Optional[str] = None
    last_update: Optional[datetime] = None

class NetworkSummary(BaseModel):
    """Summary buat dashboard cards"""
    total_hvc: dict = Field(
        ...,
        description="Total HVC per kategori",
        example={"diamond": 1, "gold": 37, "platinum": 43, "total": 81}
    )
    network_health: dict = Field(
        ...,
        description="Persentase jaringan yang SPEC vs UNSPEC",
        example={"spec": 85.5, "unspec": 14.5, "total_nodes": 545}
    )
    ticket_status: dict = Field(
        ...,
        description="Status tiket open vs closed",
        example={"open": 23, "closed": 145, "total": 168}
    )

class HVCDistribution(BaseModel):
    """Distribusi HVC per STO (buat pivot table)"""
    sto: str
    diamond: int = 0
    gold: int = 0
    platinum: int = 0
    regular: int = 0
    grand_total: int

class StatusKurma(BaseModel):
    """Status SPEC vs UNSPEC per STO"""
    sto: str
    spec: int
    unspec: int
    grand_total: int

class ODPInfo(BaseModel):
    """Info ODP dengan jumlah subscriber"""
    odp_name: str
    total_subscribers: int
    sto: str
    sector: str
    spec_count: int = 0
    unspec_count: int = 0

class FilterOptions(BaseModel):
    """Available filter options untuk frontend dropdowns"""
    stos: List[str] = []
    sectors: List[str] = []
    spec_statuses: List[str] = ["SPEC", "UNSPEC"]
