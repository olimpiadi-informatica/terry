#!/usr/bin/env python3

import csv
import sqlite3
import argparse


def main(args):
    with open(args.users) as f:
        reader = csv.DictReader(f)
        tokens = {(r["token"],) for r in reader}
    print("Inserting %d users" % len(tokens))

    query = "INSERT INTO users (token, isAdmin) VALUES (?, 0)"
    conn = sqlite3.connect(args.db)
    cur = conn.cursor()
    cur.executemany(query, tokens)
    conn.commit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("users", help="users.csv file with the 'token' column")
    parser.add_argument("db", help="output database of where to insert the users")
    args = parser.parse_args()
    main(args)