#!/usr/bin/env python3

import argparse
import common
import glob
import os.path
import re
import sys
import tempfile

from terry.logger import Logger

regex = re.compile("User (.+) has been detected with internet")

def process_pack(pack, workdir, users):
    with common.extract_and_connect(pack, workdir):
        packname = os.path.basename(pack)
        venue = packname[:3] if packname[3] == "0" else packname[:4]
        Logger.c.execute("""
            SELECT message
            FROM logs
            WHERE category = 'INTERNET_DETECTED'
        """)
        descr = next(zip(*Logger.c.description))
        logs = [dict(zip(descr, row)) for row in Logger.c.fetchall()]
        for l in logs:
            username = regex.search(l["message"]).group(1)
            if not username:
                continue
            if username not in users:
                users[username] = dict()
            if venue not in users[username]:
                users[username][venue] = 0
            users[username][venue] += 1

def main(args):
    users = dict()

    for pack in sorted(glob.glob(os.path.join(args.zip_dir, "*.zip"))):
        print("Processing %s" % os.path.basename(pack), file=sys.stderr)
        with tempfile.TemporaryDirectory() as workdir:
            process_pack(pack, workdir, users)
    for user, venues in users.items():
        for venue, freq in venues.items():
            print("%s;%s;%d" % (user, venue, freq))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("zip_dir", help="Directory with all the zips")
    args = parser.parse_args()
    main(args)
