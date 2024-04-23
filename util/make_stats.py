#!/usr/bin/env python3

import glob
import sys
import tempfile

import argparse
import common
import os.path
from terry.database import Database

data = {
    "submissions": dict(),
    "inputs": dict(),
    "delta": dict(),
    "tasks": dict()
}


def add_dates(dct, items, start_time):
    for item in items:
        t = item["date"] - start_time
        m = t // 60
        if m not in dct:
            dct[m] = 0
        dct[m] += 1


def process_pack(pack, workdir):
    global data

    with common.extract_and_connect(pack, workdir):
        contest_start = Database.get_meta("start_time", type=int)
        tasks = common.get_tasks()

        Database.c.execute("""
            SELECT
                submissions.date AS date,
                inputs.date AS input_date
            FROM submissions
            JOIN inputs ON submissions.input = inputs.id
            ORDER BY date ASC
        """)
        submissions = Database.dictify(all=True)
        add_dates(data["submissions"], submissions, contest_start)
        for sub in submissions:
            delta = sub["date"] - sub["input_date"]
            if delta not in data["delta"]:
                data["delta"][delta] = 0
            data["delta"][delta] += 1

        Database.c.execute("""
            SELECT
                inputs.date AS date
            FROM inputs
            ORDER BY date ASC
        """)
        inputs = Database.dictify(all=True)
        add_dates(data["inputs"], inputs, contest_start)

        for task in tasks:
            Database.c.execute("""
                SELECT
                    submissions.date AS date
                FROM submissions
                WHERE task = :task
                ORDER BY date ASC
            """, {"task": task})
            submissions = Database.dictify(all=True)
            if task not in data["tasks"]:
                data["tasks"][task] = dict()
            add_dates(data["tasks"][task], submissions, contest_start)


def main(args):
    global data

    for pack in sorted(glob.glob(os.path.join(args.zip_dir, "*.zip"))):
        print("Processing %s" % os.path.basename(pack), file=sys.stderr)
        with tempfile.TemporaryDirectory(dir=os.getcwd()) as workdir:
            process_pack(pack, workdir)

    max_t = max(max(data["submissions"].keys()), max(data["inputs"].keys()))
    for task in data["tasks"]:
        max_t = max(max_t, max(data["tasks"][task].keys()))

    print("t;submissions;inputs;" + ";".join(data["tasks"].keys()))
    for t in range(max_t + 1):
        submissions = data["submissions"].get(t, 0)
        inputs = data["inputs"].get(t, 0)
        tasks = [task.get(t, 0) for task in data["tasks"].values()]
        print(("%d;%d;%d" + ";%d" * len(tasks)) % (
            t, submissions, inputs, *tasks))

    print()
    print("Deltas")
    max_t = max(data["delta"].keys())
    for t in range(max_t + 1):
        print("%d;%d" % (t, data["delta"].get(t, 0)))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("zip_dir", help="Directory with all the zips")
    args = parser.parse_args()
    main(args)
