
import os
import psycopg2
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    if not DATABASE_URL:
        raise Exception("DATABASE_URL not found in backend/.env")

    return psycopg2.connect(DATABASE_URL)


if __name__ == "__main__":
    try:
        connection = get_connection()
        print("Supabase PostgreSQL connected successfully!")

        cursor = connection.cursor()
        cursor.execute("SELECT NOW();")
        result = cursor.fetchone()

        print("Database time:", result[0])

        cursor.close()
        connection.close()

    except Exception as e:
        print("Database connection failed:")
        print(e)
