#!/usr/bin/env python3
import glob
import sys
import tempfile
import time

import argparse
import common
import datetime
import os.path
import shutil
from terry.database import Database


def to_local_tz(date):
    now_timestamp = time.time()
    offset = datetime.datetime.fromtimestamp(now_timestamp) - \
             datetime.datetime.utcfromtimestamp(now_timestamp)
    return date + offset


def store_submission(submission, taskdir, workdir, source_only, ignore0):
    if submission["score"] == 0 and ignore0:
        return
    id = "attempt-%d" % submission["input_attempt"]

    if source_only:
        ext = os.path.splitext(submission["source_path"])[1]
        from_path = os.path.join(workdir, "files", submission["source_path"]).encode().decode("cp437")
        source_path = os.path.join(taskdir, id + ext)
        shutil.copy(from_path, source_path)
    else:
        submission_dir = os.path.join(taskdir, id)
        os.makedirs(submission_dir, exist_ok=True)
        source_path = os.path.join(submission_dir,
                             os.path.basename(submission["source_path"]))
        shutil.copy(os.path.join(workdir, "files", submission["source_path"]),
                    source_path)
        shutil.copy(os.path.join(workdir, "files", submission["input_path"]),
                    os.path.join(submission_dir, "input.txt"))
        shutil.copy(os.path.join(workdir, "files", submission["output_path"]),
                    os.path.join(submission_dir, "output.txt"))
        with open(os.path.join(submission_dir, "info.txt"), "w") as f:
            date = datetime.datetime.utcfromtimestamp(submission["date"])
            date = to_local_tz(date)
            f.write("Date: %s\r\n" % date.strftime('%Y-%m-%d %H:%M:%S'))
            f.write("Score: %f\r\n" % submission["score"])


def analyze_pack(pack, workdir, token, all, ignore0, source_only, no_group_venue, outdir):
    packname = os.path.basename(pack)[:4]
    if packname[3] in "0.":
        packname = packname[:3]
    with common.extract_and_connect(pack, workdir):
        users = Database.get_users()
        if token:
            users = list(filter(lambda u: u["token"] in token, users))
        if not users:
            return False
        for user in users:
            token = user["token"]
            print("Found user %s %s" % (user["name"], user["surname"]))
            tasks = common.get_tasks()
            num_submissions = 0
            for task in tasks:
                submissions = Database.get_submissions(token, task)
                num_submissions += len(submissions)
                if no_group_venue:
                    taskdir = os.path.join(outdir, task, token)
                else:
                    taskdir = os.path.join(outdir, packname, task, token)
                os.makedirs(taskdir, exist_ok=True)
                if not all:
                    best = max(submissions, key=lambda x: x["score"], default=None)
                    if best:
                        submissions = [best]
                for submission in submissions:
                    store_submission(submission, taskdir, workdir, source_only, ignore0)
            print("    > %d submissions" % num_submissions, file=sys.stderr)
        return len(token) == 1 and num_submissions > 0


def main(args):
    for pack in sorted(
            glob.glob(os.path.join(args.zip_dir, args.venue + "**"))):
        print("Analyzing pack", os.path.basename(pack), file=sys.stderr)
        with tempfile.TemporaryDirectory() as workdir:
            if analyze_pack(pack, workdir, set(args.token), args.all, args.ignore0,
                            args.source_only, args.no_group_venue, args.out_dir):
                return


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("zip_dir", help="Directory with all the zips")
    parser.add_argument("out_dir", help="Directory where to put the files")
    parser.add_argument("token", help="Token of the student", nargs="*")
    parser.add_argument("--all", help="Extract all the submissions, not only "
                                      "the best", action="store_true")
    parser.add_argument("--ignore0", help="Ignore the submissions that scored 0",
                        action="store_true")
    parser.add_argument("--source-only", help="Extract only the source",
                        action="store_true")
    parser.add_argument("--no-group-venue", help="Do not group by venue",
                        action="store_true")
    parser.add_argument("--venue", help="Prefix of the pack of the student",
                        default="")
    args = parser.parse_args()
    main(args)
