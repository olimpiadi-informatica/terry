#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
import glob
import os
import subprocess
from datetime import datetime
from typing import List, Tuple, Dict

STATIC_HEADER = """#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
"""
OLD_COPYRIGHTS = "# Copyright"


def get_git_author():
    name = subprocess.check_output(["git", "config", "user.name"]).decode().strip()
    mail = subprocess.check_output(["git", "config", "user.email"]).decode().strip()
    return "%s <%s>" % (name, mail)


def get_authors(path: str) -> List[Tuple[str, datetime]]:
    authors = subprocess.check_output(["git", "log", "--follow", "-M",
                                       "--pretty=format:%an <%ae>#%at", path])
    if not authors:
        return []
    authors = [s.split("#") for s in authors.decode().split("\n")]
    result = []
    for author in authors:
        result.append((author[0], datetime.fromtimestamp(int(author[1]))))
    if subprocess.check_output(["git", "ls-files", "-m", path]):
        result.append((get_git_author(), datetime.now()))
    return result


def join_years(years: List[int]) -> str:
    years = set(years)
    res = ""
    last_year = -1
    dash_added = False
    for year in years:
        if year == last_year + 1:
            if not dash_added:
                res += "-"
                dash_added = True
        else:
            if dash_added:
                res += str(last_year)
                dash_added = False
            if last_year != -1:
                res += ", "
            res += str(year)
        last_year = year
    if dash_added:
        res += str(last_year)
    return res


def strip_header(path: str) -> str:
    with open(path, "r") as f:
        lines = f.read().split("\n")
        matched = False
        while len(lines):
            is_good = lines[0].startswith(OLD_COPYRIGHTS)
            if len(lines[0]) == 0 or lines[0][0] != "#":
                break
            if matched and not is_good:
                break
            if is_good:
                matched = True
            lines.pop(0)
    return "\n".join(lines)


def gen_header(authors: Dict[str, List[int]]) -> str:
    header = STATIC_HEADER
    for author, years in sorted(authors.items()):
        header += "# Copyright %s - %s\n" % (join_years(years), author)
    return header


def process_file(path: str):
    authors = {}
    for author in get_authors(path):
        if author[0] not in authors:
            authors[author[0]] = []
        authors[author[0]].append(author[1].year)

    content = gen_header(authors) + strip_header(path)
    with open(path, "w") as f:
        f.write(content)


def get_files() -> List[str]:
    return glob.glob("**/*.py", recursive=True)


def main(path):
    old_cwd = os.getcwd()
    os.chdir(path)
    for f in get_files():
        process_file(f)
    os.chdir(old_cwd)


if __name__ == "__main__":
    main(".")
