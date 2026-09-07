import sqlite3

# Connect to the saved SQLite database file
conn = sqlite3.connect("database.db")
cursor = conn.cursor()

# Get the list of all tables in the database
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables:", tables)

# View rows from the 'signups' table
for table_name in tables:
    table = table_name[0]
    print(f"\n--- Contents of {table} ---")
    cursor.execute(f"SELECT * FROM {table};")
    rows = cursor.fetchall()
    for row in rows:
        print(row)

conn.close()