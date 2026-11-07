import psycopg2
from database import get_connection

def migrate():
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()

        # 1. Activity Logs Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id BIGSERIAL PRIMARY KEY,
                activity_id VARCHAR(100),
                text TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'GENERAL',
                student_id VARCHAR(100),
                student_name VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        print("[SUCCESS] activity_logs table ready")

        # 2. Emergency Quotas Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS emergency_quotas (
                id BIGSERIAL PRIMARY KEY,
                service_id VARCHAR(100) UNIQUE NOT NULL,
                service_name VARCHAR(255) NOT NULL,
                daily_limit INTEGER DEFAULT 3,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        print("[SUCCESS] emergency_quotas table ready")

        # Seed initial emergency quotas if empty
        cursor.execute("SELECT COUNT(*) FROM emergency_quotas;")
        count = cursor.fetchone()[0]
        if count == 0:
            initial_quotas = [
                ("srv-visa-01", "Visa & Travel Signature", 3),
                ("srv-acad-02", "Academic Records & Transcript", 2),
                ("srv-fina-03", "Financial Aid & Scholarships", 3),
                ("srv-host-04", "Hostel Room Allocation", 3),
                ("srv-gen-05", "General Student Affairs", 4),
            ]
            for s_id, s_name, limit in initial_quotas:
                cursor.execute("""
                    INSERT INTO emergency_quotas (service_id, service_name, daily_limit)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (service_id) DO NOTHING;
                """, (s_id, s_name, limit))
            print("[SUCCESS] emergency_quotas seeded with default limits")

        # Seed initial activity logs if empty
        cursor.execute("SELECT COUNT(*) FROM activity_logs;")
        act_count = cursor.fetchone()[0]
        if act_count == 0:
            initial_activities = [
                ("Aisha Fatima joined queue for Visa & Travel Signature", "EMERGENCY", "STU-8821", "Aisha Fatima"),
                ("Marcus Vance signed & finalized transcript for Samantha Reed", "SIGNATURE_COMPLETED", "STU-1044", "Samantha Reed"),
                ("Elena Rostova opened Counter 3 (Financial Aid Desk)", "STAFF", "STF-003", "Elena Rostova")
            ]
            for text, act_type, s_id, s_name in initial_activities:
                cursor.execute("""
                    INSERT INTO activity_logs (text, type, student_id, student_name)
                    VALUES (%s, %s, %s, %s);
                """, (text, act_type, s_id, s_name))
            print("[SUCCESS] activity_logs seeded with initial logs")

        connection.commit()
        print("[SUCCESS] Database migration completed successfully!")

    except Exception as e:
        if connection:
            connection.rollback()
        print("[ERROR] Migration failed:", str(e))
        raise e
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    migrate()
