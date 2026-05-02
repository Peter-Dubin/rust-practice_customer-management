#!/usr/bin/env python3
"""Downloads Microsoft instnwnd.sql and creates northwind.db (SQLite)"""

import re
import sqlite3
import urllib.request
import os

URL = ("https://raw.githubusercontent.com/microsoft/sql-server-samples"
       "/master/samples/databases/northwind-pubs/instnwnd.sql")

print("Downloading instnwnd.sql …")
with urllib.request.urlopen(URL) as r:
    raw = r.read()

if raw[:2] in (b'\xff\xfe', b'\xfe\xff'):
    text = raw.decode('utf-16')
elif raw[:3] == b'\xef\xbb\xbf':
    text = raw.decode('utf-8-sig')
else:
    text = raw.decode('utf-8')

print(f"  Decoded {len(text)} chars, GO count: {len(re.findall(r'(?im)^\s*GO\s*$', text))}")

TYPES = [
    (r"(?i)\bnvarchar\s*\(\s*(?:MAX|\d+)\s*\)", "TEXT"),
    (r"(?i)\bnchar\s*\(\s*\d+\s*\)",             "TEXT"),
    (r"(?i)\bvarchar\s*\(\s*(?:MAX|\d+)\s*\)",   "TEXT"),
    (r"(?i)\bchar\s*\(\s*\d+\s*\)",              "TEXT"),
    (r"(?i)\bdatetime\b",                         "TEXT"),
    (r"(?i)\bsmallint\b",                         "INTEGER"),
    (r"(?i)\btinyint\b",                          "INTEGER"),
    (r"(?i)\bbigint\b",                           "INTEGER"),
    (r"(?i)\bmoney\b",                            "REAL"),
    (r"(?i)\bfloat\b",                            "REAL"),
    (r"(?i)\bbit\b",                              "INTEGER"),
    (r"(?i)\bimage\b",                            "BLOB"),
    (r"(?i)\buniqueidentifier\b",                 "TEXT"),
    (r"(?i)\bIDENTITY\s*\(\d+\s*,\s*\d+\)",      ""),
    (r"(?i)\bGETDATE\(\)",                        "CURRENT_TIMESTAMP"),
]

def convert(sql):
    sql = re.sub(r"\[(\w+)\]", r'"\1"', sql)
    sql = re.sub(r'(?i)"dbo"\s*\.', "", sql)
    for pat, rep in TYPES:
        sql = re.sub(pat, rep, sql)
    sql = re.sub(r"(?is)\)\s*WITH\s*\(.*?\)", ")", sql)
    sql = re.sub(r'(?i)\s+ON\s+"PRIMARY"', "", sql)
    sql = re.sub(r'(?i)\s+TEXTIMAGE_ON\s+\w+', "", sql)
    sql = re.sub(r'(?i)\b(NON)?CLUSTERED\b', "", sql)
    sql = re.sub(r"\bN'", "'", sql)   # N'...' → '...'
    # T-SQL allows INSERT without INTO; SQLite requires it
    sql = re.sub(r'(?i)\bINSERT\s+(?!INTO\b)', 'INSERT INTO ', sql)
    return sql.strip()

def split_into_statements(sql):
    """Split a block that may contain multiple un-semicoloned statements."""
    # Insert semicolons before each new INSERT/CREATE at line start
    sql = re.sub(r'(?im)^(INSERT\b|Create\b)', r';\1', sql)
    # Split on semicolons, filter blanks
    parts = [s.strip() for s in sql.split(';') if s.strip()]
    return parts

if os.path.exists("northwind.db"):
    os.remove("northwind.db")

blocks = re.split(r"(?im)^\s*GO\s*$", text)

SKIP = ("use ", "set ", "exec ", "sp_", "print ",
        "grant ", "deny ", "revoke ", "create view",
        "create proc", "create function", "create trigger",
        "alter table")

conn = sqlite3.connect("northwind.db")
ok = errors = 0

for block in blocks:
    block = block.strip()
    if not block:
        continue
    lower = block.lower()
    if any(lower.startswith(s) for s in SKIP):
        continue

    has_create = bool(re.search(r'(?im)^CREATE\s+TABLE', block))
    has_insert = bool(re.search(r'(?im)^INSERT\b', block))

    if not has_create and not has_insert:
        continue

    for stmt in split_into_statements(convert(block)):
        sl = stmt.lower().lstrip()
        if not sl:
            continue
        if any(sl.startswith(s) for s in SKIP):
            continue
        if not (sl.startswith("create table") or sl.startswith("insert into")):
            continue
        try:
            conn.execute(stmt)
            ok += 1
        except Exception as e:
            errors += 1
            print(f"  error ({stmt[:70]!r}): {e}")

conn.commit()

cur = conn.cursor()
tables = [r[0] for r in cur.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
).fetchall()]
print(f"\nTables: {tables}")
for t in tables:
    count = cur.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
    print(f"  {t}: {count} rows")
conn.close()

print(f"\nDone — {ok} statements ok, {errors} errors")
