#!/usr/bin/env python3

import sys
import csv
import os.path
import argparse
import subprocess

from make_cred import get_nth_sede

def main(args):
    with open(args.sedi, "r") as f:
        sedi = [sede["sede"] for sede in csv.DictReader(f, delimiter=";")]

    foglietti_py = os.path.join(os.path.dirname(__file__), "foglietti.py")
    os.makedirs(args.output_dir, exist_ok=True)

    for sede in sedi:
        full_sede = get_nth_sede(sede, 1)
        contest_yaml = os.path.join(args.users, "%s.yaml" % full_sede)
        output = os.path.join(args.output_dir, "%s.pdf" % sede)
        print("%s\t%s -> %s" % (sede, contest_yaml, output))
        subprocess.run([foglietti_py, sede, contest_yaml, output])

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("sedi", help="CSV con sede;aule (codice sede, numero aule)")
    parser.add_argument("users", help="Cartella con i contest.yaml (__users__)")
    parser.add_argument("output_dir", help="Cartella (viene creata) dove mettere i yaml con le info del contest per ogni sede")
    main(parser.parse_args())
