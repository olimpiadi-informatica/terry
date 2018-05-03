#!/usr/bin/env python3

import csv
import glob
import tempfile

import argparse
import common
import os.path
from terry.database import Database

data = dict()


def process_pack(pack, workdir):
    global data

    with common.extract_and_connect(pack, workdir):
        venue = "-".join(os.path.basename(pack).split("-")[0:2])
        tasks = common.get_tasks()
        users = Database.get_users()
        for user in users:
            if not user["ip"]:
                continue

            token = user["token"]
            user["venue"] = venue
            for task in tasks:
                user[task] = Database.get_user_task(token, task)["score"]
                if token in data:
                    user[task] = max(user[task], data[token][task])
            user["score"] = sum(user[task] for task in tasks)

            if token in data:
                old_venue = data[token]["venue"]
                print("WARNING: %s has connected in %s and %s" %
                      (token, venue, old_venue))
            data[token] = user

    return tasks


def main(args):
    global data

    patch = []
    if args.patch:
        with open(args.patch, "r") as f:
            patch = dict((d["token"], dict(d))
                         for d in csv.DictReader(f, delimiter=";"))

    tasks = []
    for pack in sorted(glob.glob(os.path.join(args.zip_dir, "*.zip"))):
        print("Processing %s" % os.path.basename(pack))
        with tempfile.TemporaryDirectory() as workdir:
            tasks = process_pack(pack, workdir)

    for token, user in data.items():
        venue = user["venue"][:4]
        if venue[-1] == "0":
            venue = venue[:3]

        if token in patch:
            assert venue == patch[token]["old"]
            venue = patch[token]["new"]

        user["venue"] = venue

    with open(args.out_csv, "w") as f:
        keys = ["venue", "surname", "name"] + tasks + ["score"]
        writer = csv.DictWriter(f, keys)
        writer.writeheader()
        writer.writerows(dict((x, d[x]) for x in keys) for d in data.values())


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("zip_dir", help="Directory with all the zips")
    parser.add_argument("out_csv", help="Output CSV")
    parser.add_argument("--patch", help="CSV with old;new;token")
    args = parser.parse_args()
    main(args)
