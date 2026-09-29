from services.payment.settlement import process_settlement

def verify_token(token: str):
    if not token:
        return False
    # circular check
    return process_settlement("merchant_1", 0)

def dead_crypto_helper():
    return "legacy_md5_hash"
