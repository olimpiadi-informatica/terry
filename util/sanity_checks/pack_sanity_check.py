#!/usr/bin/env python3

import argparse
import csv
import json
import glob
import os.path
import shutil
import subprocess
import tempfile
import time
import zipfile

import ruamel.yaml
from colorama import Fore

from terry.crypto import validate, metadata, decode, decode_data, SECRET_LEN, \
    recover_file_password

from utils import get_output, evaluate, get_stats

USERNAME_LEN = 6
HERE = os.path.dirname(os.path.abspath(__file__))


def get_nth_room(sede, aula):
    char_per_aula = USERNAME_LEN - len(sede)
    if char_per_aula < 0:
        raise ValueError("Name too long")
    return "%s%s" % (sede, str(aula).zfill(USERNAME_LEN - len(sede)))


def validate_task(task, fuzz, iterations, solutions):
    print(Fore.BLUE, "Validating task %s..." % task, Fore.RESET)
    generators = glob.glob(os.path.join(task, "managers", "generator.linux.*"))
    checkers = glob.glob(os.path.join(task, "managers", "checker.linux.*"))
    validators = glob.glob(os.path.join(task, "managers", "validator.linux.*"))
    task_yaml = os.path.join(task, "task.yaml")

    assert generators
    assert checkers
    assert os.path.exists(task_yaml)

    generator = generators[0]
    checker = checkers[0]

    os.chmod(generator, 0o755)
    os.chmod(checker, 0o755)
    if validators:
        validator = validators[0]
        os.chmod(validator, 0o755)
    else:
        print(Fore.YELLOW, "WARNING: Missing validator for task %s" % task,
              Fore.RESET)
        validator = None

    with open(task_yaml, "r") as f:
        task_info = ruamel.yaml.safe_load(f)
    assert task_info["name"]
    assert task_info["description"]
    assert task_info["max_score"]
    max_score = task_info["max_score"]

    seed = "42"
    input = os.path.join(task, "input.txt")
    with open(input, "w") as f:
        print("    generating input")
        f.write(get_output([generator, seed, "0"]))
    if validator:
        with open(input, "rb") as f:
            print("    validating input")
            get_output([validator, "0"], f.read())

    if fuzz:
        for f in os.listdir(os.path.join(HERE, "bad_outputs")):
            path = os.path.join(HERE, "bad_outputs", f)
            if not os.path.isfile(path):
                continue
            print("    checking against %s" % f, end="")
            start = time.monotonic()
            output = get_output([checker, input, path])
            end = time.monotonic()
            print(" -- %.3fs" % (end-start))
            if end - start >= 1:
                print(Fore.YELLOW, "WARNING: check took more than 1 second",
                      Fore.RESET)
            if not output:
                raise AssertionError("Checker didn't print any json")
            data = json.loads(output)
            if "score" not in data:
                raise AssertionError("Check didn't print the score")
            if "feedback" not in data:
                raise AssertionError("Check didn't print the feedback")
            if "validation" not in data:
                raise AssertionError("Check didn't print the validation")
    for solution in solutions:
        print("Testing:", os.path.basename(solution), "with", iterations, "iterations")
        results = []
        for i in range(iterations):
            results.append(evaluate(generator, validator, checker, solution))
            if int(100*i/iterations) % 10 == 0:
                print("  %d%%" % (100*i/iterations), end="", flush=True)
        print("  100%")
        score = get_stats(results, 0)
        gen = get_stats(results, 1)
        val = get_stats(results, 2)
        sol = get_stats(results, 3)
        chk = get_stats(results, 4)
        print("  Score: [%.3f - %.3f] avg: %.3f" % (score[0]*max_score, score[1]*max_score, score[2]*max_score))
        print("  Gen time: [%.3fs - %.3fs] avg: %.3fs" % (gen[0], gen[1], gen[2]))
        print("  Val time: [%.3fs - %.3fs] avg: %.3fs" % (val[0], val[1], val[2]))
        print("  Sol time: [%.3fs - %.3fs] avg: %.3fs" % (sol[0], sol[1], sol[2]))
        print("  Chk time: [%.3fs - %.3fs] avg: %.3fs" % (chk[0], chk[1], chk[2]))


def validate_sedi(sedi):
    print(Fore.BLUE, "Validating sedi...", Fore.RESET)
    with open(sedi) as f:
        reader = list(csv.DictReader(f, delimiter=";"))
    tokens = set()
    for row in reader:
        sede = row["sede"]
        num = int(row["aule"])
        print("    %s" % sede)
        with open(os.path.join("__users__", get_nth_room(sede, 1) + ".yaml")) \
                as f:
            contest = ruamel.yaml.safe_load(f)
            for user in contest["users"]:
                if user["token"] in tokens:
                    raise AssertionError("Duplicate token: %s" % user["token"])
                tokens.add(user["token"])
        for aula in range(1, num + 1):
            full_sede = get_nth_room(sede, aula)
            if not os.path.exists(os.path.join("__users__",
                                               "%s.yaml" % full_sede)):
                raise AssertionError("YAML for sede %s not found" % full_sede)
            with open(os.path.join("__users__", full_sede + ".yaml")) as f:
                contest2 = ruamel.yaml.safe_load(f)
                if contest != contest2:
                    raise AssertionError("YAML for room %d is different from "
                                         "room 1 in %s" % (aula, sede))


def validate_admin(admin, password):
    print(Fore.BLUE, "Validating admins...", Fore.RESET)
    with open(admin) as f:
        admins = list(csv.DictReader(f, delimiter=";"))
    for admin in admins:
        full_sede = admin["full_sede"]
        print("    %s" % full_sede)
        token = admin["password"]
        if full_sede != token.split("-")[0]:
            raise AssertionError(
                "Token of admin %s does not starts with %s-" % (
                    full_sede, full_sede))
        secret, passwd = decode_data(token[len(full_sede) + 1:], SECRET_LEN)
        if recover_file_password(full_sede, secret, passwd).hex() != password:
            raise AssertionError("Invalid token for admin %s" % full_sede)


def main(args):
    with open(args.pack, "rb") as pack:
        pack = pack.read()
    if not validate(pack):
        raise AssertionError("Corrupted pack")
    meta = ruamel.yaml.safe_load(metadata(pack).strip(b"\x00"))
    if meta.get("deletable"):
        print(Fore.YELLOW, "WARNING: The pack is marked as deletable",
              Fore.RESET)
    if not meta.get("name"):
        print(Fore.YELLOW, "WARNING: The pack metadata does not include 'name'",
              Fore.RESET)
    if not meta.get("description"):
        print(Fore.YELLOW,
              "WARNING: The pack metadata does not include 'description'",
              Fore.RESET)
    decoded = decode(bytes.fromhex(args.password), pack)

    tasks = args.tasks.split(",")
    if args.solutions:
        solutions = [list(map(os.path.abspath, s.split(","))) for s in args.solutions.split(";")]
    else:
        solutions = [[]] * len(tasks)

    extract_dir = tempfile.mkdtemp()
    os.chdir(extract_dir)
    print("Working in %s" % extract_dir)

    with open("pack.zip", "wb") as f:
        f.write(decoded)
    with zipfile.ZipFile("pack.zip") as zip_file:
        zip_file.extractall(".")
    if args.sedi:
        validate_sedi(args.sedi)
    if args.admin:
        validate_admin(args.admin, args.password)
    for i, task in enumerate(tasks):
        if not os.path.exists(task):
            raise AssertionError("Task %s not included in the pack" % task)
        sols = solutions[i] if i < len(solutions) else []
        validate_task(task, args.fuzz, args.iterations, sols)

    shutil.rmtree(extract_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("pack", help="pack.zip.enc to check")
    parser.add_argument("password", help="Password of the pack")
    parser.add_argument("tasks", help="List of the task names, "
                                      "comma separated")
    parser.add_argument("--sedi", help="CSV with sede;aule to check the "
                                       "users", type=os.path.abspath)
    parser.add_argument("--admin", help="CSV with sede;full_sede;token to "
                                        "check admin tokens",
                        type=os.path.abspath)
    parser.add_argument("--fuzz", help="Perform an intensive test of the "
                                       "checker fuzzing some inputs and "
                                       "outputs",
                        action="store_true")
    parser.add_argument("--iterations", help="Number of iterations of checks",
                        action="store", default=100, type=int)
    parser.add_argument("--solutions", help="List of paths to solutions for each task (; to separate tasks, comma to separate solution for each task)",
                        action="store")
    main(parser.parse_args())
