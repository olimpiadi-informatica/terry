#!/usr/bin/env python3

import sys
import csv
import os
import math
import yaml
import random
import argparse
import subprocess

USERNAME_LEN = 6
TOKEN_LEN = 6
TOKEN_CHARS = "abcdefghjkmnopqrstuvwxyz23456789"
STUD_AULA_TRESH = 40

used_tokens = set()
demo_tokens = dict()

def get_nth_sede(sede, aula):
    char_per_aula = USERNAME_LEN - len(sede)
    if char_per_aula < 0:
        raise ValueError("Nome sede + numero aula troppo lungo")
    return "%s%s" % (sede, str(aula).zfill(USERNAME_LEN-len(sede)))

def gen_token():
    while True:
        token = "".join([random.choice(TOKEN_CHARS) for _ in range(TOKEN_LEN)])
        if token in used_tokens:
            continue
        used_tokens.add(token)
        return token

def gen_token_demo(sede):
    if sede not in demo_tokens:
        demo_tokens[sede] = 0
    demo_tokens[sede] += 1
    return "demo.%s.%d" % (sede, demo_tokens[sede])


def gen_admin_token(password, sede):
    proc = subprocess.Popen(["terr-gen-password", password, sede], stdout=subprocess.PIPE)
    stdout, stderr = proc.communicate()
    return stdout.decode().strip()


def main(args):
    with open(args.sedi, "r") as f:
        num_aule = dict([sede["sede"], int(sede["aule"])] for sede in csv.DictReader(f, delimiter=";"))

    with open(args.atleti, "r") as f:
        reader = list(csv.DictReader(f, delimiter=";"))

    with open(args.metadata, "r") as f:
        metadata = yaml.load(f)

    tasks = args.tasks.split(",")

    atleti = dict()
    for sede in num_aule:
        atleti[sede] = []

    for atleta in reader:
        nome = atleta["Nome"]
        cognome = atleta["Cognome"]
        sede = atleta["sede"]
        if args.demo:
            token = gen_token_demo(sede)
        else:
            token = gen_token()
        atleti[sede] += [{"token": token, "name": nome, "surname": cognome}]

    os.makedirs(args.output_dir, exist_ok=True)

    for sede, atl in atleti.items():
        descrizione = metadata["description"] % sede if "%s" in metadata["description"] else metadata["description"]
        for aula in range(1, num_aule[sede]+1):
            full_sede = get_nth_sede(sede, aula)
            path = os.path.join(args.output_dir, full_sede + ".yaml")
            backup = [{"name": "Riserva %d" % (i+1), "surname": sede, "token": gen_token(), "hidden": True} for i in range(args.num_backup)]
            contest = {"name": metadata["name"], "description": descrizione, "duration": args.durata, "users": atl + backup, "tasks": tasks}
            with open(path, "w") as f:
                f.write(yaml.dump(contest))
        atl_per_aula = len(atl)/num_aule[sede]
        print("%6s  %3d atleti  %2d aule  %4.1f atl/aula %s" % (sede, len(atl), num_aule[sede], atl_per_aula, "*" if atl_per_aula > STUD_AULA_TRESH else ""), file=sys.stderr)
    if args.password:
        print("sede;full_sede;password")
        for sede in atleti:
            print("%s..." % sede, file=sys.stderr)
            for aula in range(1, num_aule[sede]+1):
                full_sede = get_nth_sede(sede, aula)
                password = gen_admin_token(args.password, full_sede)
                print("%s;%s;%s" % (sede, full_sede, password))



if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("metadata", help="metadata.yaml con i metadati del contest (nome e descrizione)")
    parser.add_argument("durata", help="Durata del contest", type=int)
    parser.add_argument("tasks", help="Nomi dei task, separati da virgola")
    parser.add_argument("sedi", help="CSV con sede;aule (codice sede, numero aule)")
    parser.add_argument("atleti", help="CSV con sede;nome;cognome")
    parser.add_argument("output_dir", help="Cartella (viene creata) dove mettere i yaml con le info del contest per ogni sede")
    parser.add_argument("--password", help="Password dello zip da usare per generare le password dei pack")
    parser.add_argument("--demo", help="Genera credenziali per la demo", action="store_true", default=False)
    parser.add_argument("--num-backup", help="Aggiunge degli account di backup in ogni sede", action="store", default=0, type=int)
    main(parser.parse_args())
