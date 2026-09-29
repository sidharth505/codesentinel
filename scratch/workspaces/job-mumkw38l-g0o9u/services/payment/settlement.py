import requests
from services.auth.jwt_broker import verify_token

def process_settlement(merchant_id: str, amount: float):
    try:
        # missing socket timeout
        resp = requests.post("https://payment.gw/charge", json={"amt": amount})
    except Exception:
        pass # silent exception suppression
    return True
