import math
from datetime import datetime, timedelta

# Koordinat Pusat Balikpapan (Kantor Telkom/Pusat Operasional WOC)
BALIKPAPAN_LAT = -1.256257
BALIKPAPAN_LON = 116.866563
MAX_RADIUS_KM = 50.0

def get_wita_now():
    """Mengembalikan waktu saat ini dalam WITA (UTC+8)"""
    return datetime.utcnow() + timedelta(hours=8)

def is_within_operational_hours() -> bool:
    """Memeriksa apakah waktu saat ini berada di jam operasional 08:00 - 22:00 WITA"""
    wita_now = get_wita_now()
    current_hour = wita_now.hour
    return 8 <= current_hour < 22

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float = BALIKPAPAN_LAT, lon2: float = BALIKPAPAN_LON) -> float:
    """Menghitung jarak antara dua koordinat menggunakan rumus Haversine (dalam KM)"""
    R = 6371.0  # Radius bumi dalam kilometer
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def is_within_allowed_location(lat: float, lon: float) -> bool:
    """Memeriksa apakah koordinat berada di dalam radius yang diizinkan"""
    distance = calculate_haversine_distance(lat, lon)
    return distance <= MAX_RADIUS_KM
