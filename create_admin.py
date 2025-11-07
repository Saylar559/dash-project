import psycopg2
import bcrypt

conn = psycopg2.connect(
    dbname="escrow_dashboard",
    user="postgres",
    password="postgres",
    host="localhost",
    port=5432
)
cur = conn.cursor()

username = "admin"
email = "admin@test.com"
password = "admin123"
role = "ADMIN"
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

cur.execute("""
    INSERT INTO users (username, email, hashed_password, role)
    VALUES (%s, %s, %s, %s)
    ON CONFLICT (username) DO NOTHING
""", (username, email, hashed, role))

conn.commit()
cur.close()
conn.close()
print(f'Пользователь admin создан! (логин: admin, пароль: admin123)')
