#!/usr/bin/env python3

import sys
import csv
import os
import math
import yaml

USERNAME_LEN = 6

def get_nth_sede(sede, aula):
    if len(sede) + int(math.log10(aula)) + 1 > USERNAME_LEN:
        raise ValueError("Nome sede + numero aula troppo lungo")
    char_per_aula = USERNAME_LEN - len(sede)
    return "%s%s" % (sede, str(aula).zfill(USERNAME_LEN-len(sede)))

def gen_token():
    return "password"

if len(sys.argv) != 7:
    print("Usage: %s nome descrizione durata sedi.csv atleti.csv outputdir" % sys.argv[0])
    sys.exit(1)

def main():
    nome_contest = sys.argv[1]
    descrizione_contest = sys.argv[2]
    durata = int(sys.argv[3])
    sedi_file = sys.argv[4]
    atleti_file = sys.argv[5]
    output_dir = sys.argv[6]

    with open(sedi_file, "r") as f:
        num_aule = dict([sede["sede"], int(sede["aule"])] for sede in csv.DictReader(f, delimiter=";"))

    with open(atleti_file, "r") as f:
        reader = list(csv.DictReader(f, delimiter=";"))

    atleti = dict()
    for sede in num_aule:
        atleti[sede] = []

    for atleta in reader:
        nome = atleta["Nome"]
        cognome = atleta["Cognome"]
        sede = atleta["sede"]
        atleti[sede] += [{"token": gen_token(), "name": nome, "surname": cognome}]

    os.makedirs(output_dir, exist_ok=True)

    for sede, atl in atleti.items():
        for aula in range(1, num_aule[sede]+1):
            full_sede = get_nth_sede(sede, aula)
            path = os.path.join(output_dir, full_sede + ".yaml")
            contest = {"name": nome_contest, "description": descrizione_contest, "duration": durata, "users": atl}
            with open(path, "w") as f:
                f.write(yaml.dump(contest))


if __name__ == "__main__":
    main()
