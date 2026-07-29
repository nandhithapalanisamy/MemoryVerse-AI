from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.app.config import settings

def ensure_database_exists():
    url = settings.DATABASE_URL
    if url.startswith("sqlite"):
        return
        
    rindex = url.rfind('/')
    if rindex == -1:
        return
        
    base_url = url[:rindex]
    db_name = url[rindex+1:]
    
    # Try connecting to the target database
    try:
        temp_engine = create_engine(url)
        conn = temp_engine.connect()
        conn.close()
        temp_engine.dispose()
        return
    except Exception:
        # If it fails, database might not exist
        pass
        
    # Connect to the default 'postgres' database to run CREATE DATABASE
    sys_url = f"{base_url}/postgres"
    try:
        sys_engine = create_engine(sys_url)
        conn = sys_engine.raw_connection()
        conn.set_isolation_level(0) # AUTOCOMMIT
        cursor = conn.cursor()
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname='{db_name}'")
        exists = cursor.fetchone()
        if not exists:
            cursor.execute(f"CREATE DATABASE {db_name}")
        cursor.close()
        conn.close()
        sys_engine.dispose()
    except Exception as e:
        print(f"PostgreSQL automatic DB creation check failed: {str(e)}")

# Run DB existence check
ensure_database_exists()

# Adjust sqlite connect arguments if sqlite is selected
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
