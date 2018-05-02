#!/usr/bin/env python3

import contextlib
import glob
import sys
import tempfile
import zipfile

import argparse
import os.path
from terry.config import Config
from terry.database import Database


@contextlib.contextmanager
def remember_cwd(newdir):
    curdir = os.getcwd()
    os.chdir(newdir)
    try:
        yield
    finally:
        os.chdir(curdir)


data = {
    "submissions": dict(),
    "inputs": dict(),
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

    with zipfile.ZipFile(pack) as f:
        f.extractall(workdir)
    db_path = os.path.join(workdir, "db.sqlite3")
    Config.db = db_path
    Database.connect_to_database()

    contest_start = Database.get_meta("start_time", type=int)
    tasks = [t["name"] for t in Database.get_tasks()]

    Database.c.execute("""
        SELECT
            submissions.date AS date
        FROM submissions
        ORDER BY date ASC
    """)
    submissions = Database.dictify(all=True)
    add_dates(data["submissions"], submissions, contest_start)

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

    Database.disconnect_database()


def main(args):
    global data

    for pack in sorted(glob.glob(os.path.join(args.zip_dir, "*.zip"))):
        print("Processing %s" % os.path.basename(pack), file=sys.stderr)
        with tempfile.TemporaryDirectory() as workdir:
            process_pack(pack, workdir)

    max_t = max(max(data["submissions"].keys()), max(data["inputs"].keys()))
    for task in data["tasks"]:
        max_t = max(max_t, max(data["tasks"][task].keys()))

    print("t;submissions;inputs;" + ";".join(data["tasks"].keys()))
    for t in range(max_t+1):
        submissions = data["submissions"].get(t, 0)
        inputs = data["inputs"].get(t, 0)
        tasks = [task.get(t, 0) for task in data["tasks"].values()]
        print(("%d;%d;%d"+";%d"*len(tasks)) % (t, submissions, inputs, *tasks))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("zip_dir", help="Directory with all the zips")
    args = parser.parse_args()
    main(args)
