#!/usr/bin/env python3

import sys
import csv
import sqlite3
import argparse


def main(args):
    if args.users is not None:
        with open(args.users) as f:
            reader = csv.DictReader(f)
            tokens = {(r["token"],) for r in reader}
    else:
        conn = sqlite3.connect(args.terrydb)
        cur = conn.cursor()
        tokens = cur.execute('SELECT token FROM users').fetchall()
        conn.close()

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
    parser.add_argument("db", help="output database of where to insert the users")
    parser.add_argument("--users", help="users.csv file with the 'token' column")
    parser.add_argument("--terrydb", help="terry database to read users from")
    args = parser.parse_args()

    if (args.terrydb is None and args.users is None) or (args.terrydb is not None and args.users is not None):
        print("Exactly one of --users and --terrydb must be provided", file=sys.stderr)
        sys.exit(1)

    main(args)
