#!/usr/bin/env python3

import csv
import sqlite3
import argparse


def main(args):
    with open(args.users) as f:
        reader = csv.DictReader(f)
        tokens = {(r["token"],) for r in reader}
    print("Loaded %d users" % len(tokens))

    conn = sqlite3.connect(args.db)
    cur = conn.cursor()

    existing = set(x[0] for x in cur.execute('SELECT token from users').fetchall())
    tokens = [x for x in tokens if x[0] not in existing]
    print("Inserting %d users" % len(tokens))

    query = "INSERT INTO users (token, isAdmin) VALUES (?, 0)"
    cur.executemany(query, tokens)
    conn.commit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("users", help="users.csv file with the 'token' column")
    parser.add_argument("db", help="output database of where to insert the users")
    args = parser.parse_args()
    main(args)