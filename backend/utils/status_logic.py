"""
Status determination logic untuk GPON network
Update dengan threshold dari real data Excel
"""
from typing import Optional


# Threshold dari Excel STATUS KURMA formula
SPEC_MIN = -24.89  # Changed from -26
SPEC_MAX = -13.5   # Changed from -13

# Error codes yang dianggap UNSPEC
ERROR_CODES = [-500, -501, -502, -503, -504]


def determine_spec_status(rx_power: Optional[float]) -> str:
    """
    Determine SPEC/UNSPEC status berdasarkan RX Power
    
    Logic dari Excel:
    =IF(OR(ISBLANK(W2);W2="null";W2=-500;W2=-501;W2=-502;W2=-503;W2=-504);"UNSPEC";
       IF(W2>-13,5;"UNSPEC";IF(W2<-24,89;"UNSPEC";"SPEC")))
    
    Args:
        rx_power: RX Power value dalam dB
    
    Returns:
        "SPEC" atau "UNSPEC"
    """
    # Handle blank/null/error codes
    if rx_power is None:
        return "UNSPEC"
    
    if rx_power in ERROR_CODES:
        return "UNSPEC"
    
    # Range check: must be between -24.89 and -13.5
    if rx_power > SPEC_MAX:  # Terlalu tinggi (lemah)
        return "UNSPEC"
    
    if rx_power < SPEC_MIN:  # Terlalu rendah (kuat tapi abnormal)
        return "UNSPEC"
    
    return "SPEC"


def determine_ticket_status(spec_status: str) -> str:
    """
    Determine ticket status berdasarkan SPEC status
    
    Logic dari Excel KET column:
    =IF(X2="SPEC"; "CLOSED";"SISA TIKET")
    
    Args:
        spec_status: "SPEC" atau "UNSPEC"
    
    Returns:
        "CLOSED" atau "SISA TIKET"
    """
    return "CLOSED" if spec_status == "SPEC" else "SISA TIKET"


def get_status_color(spec_status: str) -> str:
    """
    Get Tailwind CSS color class untuk status badge
    
    Args:
        spec_status: "SPEC" atau "UNSPEC"
    
    Returns:
        Tailwind CSS class string
    """
    if spec_status == "SPEC":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
    else:
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"


def get_rx_power_color(rx_power: Optional[float]) -> str:
    """
    Get Tailwind CSS color class untuk RX Power value
    Based on SPEC range
    
    Args:
        rx_power: RX Power value dalam dB
    
    Returns:
        Tailwind CSS class string
    """
    if rx_power is None:
        return "text-muted-foreground"
    
    spec_status = determine_spec_status(rx_power)
    
    if spec_status == "SPEC":
        return "text-green-600 dark:text-green-400"
    else:
        return "text-red-600 dark:text-red-400"


if __name__ == "__main__":
    # Test cases
    test_cases = [
        (-20.0, "SPEC", "CLOSED"),      # Normal SPEC
        (-13.0, "UNSPEC", "SISA TIKET"),  # Too high
        (-25.0, "UNSPEC", "SISA TIKET"),  # Too low
        (-500, "UNSPEC", "SISA TIKET"),   # Error code
        (None, "UNSPEC", "SISA TIKET"),   # Null
        (-15.0, "SPEC", "CLOSED"),      # Normal SPEC
        (-24.0, "SPEC", "CLOSED"),      # Edge case SPEC
    ]
    
    print("Testing status determination logic:")
    print("=" * 70)
    print(f"{'RX Power':>10} | {'Expected':>8} | {'Got':>8} | {'Ticket':>12} | {'Match':>5}")
    print("=" * 70)
    
    all_pass = True
    for rx_power, expected_spec, expected_ticket in test_cases:
        actual_spec = determine_spec_status(rx_power)
        actual_ticket = determine_ticket_status(actual_spec)
        
        spec_match = "✓" if actual_spec == expected_spec else "✗"
        ticket_match = "✓" if actual_ticket == expected_ticket else "✗"
        
        if actual_spec != expected_spec or actual_ticket != expected_ticket:
            all_pass = False
        
        print(f"{str(rx_power):>10} | {expected_spec:>8} | {actual_spec:>8} | {actual_ticket:>12} | {spec_match:>5}")
    
    print("=" * 70)
    if all_pass:
        print("✓ All tests passed!")
    else:
        print("✗ Some tests failed!")
