#!/usr/bin/env python3

import argparse
import yaml
import os
import shutil
import tempfile

from subprocess import check_call, CalledProcessError
from jinja2 import Template
from itertools import cycle

USERS_PER_PAGE = 10
BASEDIR = os.path.abspath(os.path.join(os.path.dirname(__file__)))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('sede', help='Nome della sede')
    parser.add_argument(
        'contest_yaml', type=argparse.FileType('r'),
        help="YAML del contest di una sede")
    parser.add_argument(
        'output',
        help="Percorso del file di output")

    args = parser.parse_args()

    contest = yaml.load(args.contest_yaml)
    users = [u for u in contest["users"] if not u.get("hidden")]
    users.sort(key=lambda x: x['surname'] + ":" + x["name"])

    npages = (len(users) + USERS_PER_PAGE - 1) // USERS_PER_PAGE
    pages = [[] for a in range(npages)]

    for page, user in zip(cycle(pages), users):
        page.append(user)

    dstfile = os.path.join(os.getcwd(), args.output)
    tmpdir = tempfile.mkdtemp()

    templatepath = os.path.join(BASEDIR, 'foglietti.tex')
    with open(templatepath, 'r') as f:
        template = Template(f.read())

    with open(os.path.join(tmpdir, 'foglietti.tex'), 'w') as f:
        f.write(template.render(pages=pages, contest_name=contest["name"], sede=args.sede))

    try:
        with open(os.path.join(tmpdir, "stdout.log"), "w") as stdout:
            with open(os.path.join(tmpdir, "stderr.log"), "w") as stderr:
                check_call(['pdflatex', '-interaction=nonstopmode',
                            'foglietti.tex'], cwd=tmpdir, stdout=stdout,
                            stderr=stderr)
        shutil.copyfile(os.path.join(tmpdir, 'foglietti.pdf'), dstfile)
    except FileNotFoundError:
        print("Compilation failed! Make sure you have pdflatex installed")
    except CalledProcessError:
        print("Compilation failed! Template path: %s" % tmpdir)
        raise
    else:
        shutil.rmtree(tmpdir)


if __name__ == "__main__":
    main()
