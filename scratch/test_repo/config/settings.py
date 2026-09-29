import os
SECRET_KEY = os.getenv("SECRET_KEY", "insecure-dev-fallback-key")
DEBUG = True
