#!/usr/bin/env python3

from sys import exit
import sys
import csv
import os
import math
import ruamel.yaml
import random
import argparse
import subprocess

USERNAME_LEN = 6
TOKEN_LEN = 6
TOKEN_CHARS = "abcdefghjkmnopqrstuvwxyz23456789"
STUD_ROOM_TRESH = 40

used_tokens = set()
demo_tokens = dict()


def get_nth_venue(venue, room):
    char_per_room = USERNAME_LEN - len(venue)
    if char_per_room < 0:
        raise ValueError("Venue name too long")
    return "%s%s" % (venue.upper(), str(room).zfill(char_per_room))


def gen_token():
    while True:
        token = "".join([random.choice(TOKEN_CHARS) for _ in range(TOKEN_LEN)])
        if token in used_tokens:
            continue
        used_tokens.add(token)
        return token


def gen_token_demo(venue):
    if venue not in demo_tokens:
        demo_tokens[venue] = 0
    demo_tokens[venue] += 1
    return "demo.%s.%d" % (venue, demo_tokens[venue])


def gen_admin_token(password, venue):
    return (
        subprocess.check_output(["terr-gen-password", password, venue]).decode().strip()
    )


def main(args):
    num_rooms = {}
    with open(args.venues, "r") as f:
        for venue in csv.DictReader(f):
            for field in ["venue", "rooms"]:
                if field not in venue:
                    exit("{} missing in venue {}".format(field, venue))
            num_rooms[venue["venue"]] = int(venue["rooms"])

    with open(args.contestants, "r") as f:
        reader = list(csv.DictReader(f))

    with open(args.metadata, "r") as f:
        metadata = ruamel.yaml.safe_load(f)

    for field in ["name", "description"]:
        if field not in metadata:
            exit("{} not present in the metadata".format(field))

    tasks = args.tasks.split(",")

    contestants = dict()
    for venue in num_rooms:
        contestants[venue] = []

    for i, contestant in enumerate(reader):
        for field in ["name", "surname", "venue"]:
            if field not in contestant:
                exit("{} is not present in the {}-th contestant: {}".format(field, i+1, contestant))
        name = contestant["name"]
        surname = contestant["surname"]
        venue = contestant["venue"]
        if "token" in contestant:
            token = contestant["token"]
        elif args.demo:
            token = gen_token_demo(venue)
        else:
            token = gen_token()
        contestants[venue] += [
            {"token": token, "name": name, "surname": surname, **contestant}
        ]

    os.makedirs(args.output_dir, exist_ok=True)

    for venue, venue_contestants in contestants.items():
        if args.description:
            with open(args.description) as f:
                description = f.read()
        else:
            description = metadata["description"]
        for room in range(1, num_rooms[venue] + 1):
            full_venue = get_nth_venue(venue, room)
            path = os.path.join(args.output_dir, full_venue + ".yaml")
            backup = [
                {
                    "name": "Backup %d" % (i + 1),
                    "surname": venue,
                    "token": gen_token(),
                    "hidden": True,
                }
                for i in range(args.num_backup)
            ]
            contest = {
                "name": metadata["name"],
                "description": description,
                "duration": args.duration,
                "users": venue_contestants + backup,
                "tasks": tasks,
            }
            if args.window_duration:
                contest["window_duration"] = args.window_duration

            with open(path, "w") as f:
                f.write(ruamel.yaml.dump(contest))

        venue_contestants_per_room = len(venue_contestants) / num_rooms[venue]
        print(
            "%6s  %3d contestants  %2d rooms  %4.1f venue_contestants/room %s"
            % (
                venue,
                len(venue_contestants),
                num_rooms[venue],
                venue_contestants_per_room,
                "*" if venue_contestants_per_room > STUD_ROOM_TRESH else "",
            ),
            file=sys.stderr,
        )

    if args.password:
        print("venue,full_venue,password")
        for venue in contestants:
            print("%s..." % venue, file=sys.stderr)
            for room in range(1, num_rooms[venue] + 1):
                full_venue = get_nth_venue(venue, room)
                password = gen_admin_token(args.password, full_venue)
                print("%s,%s,%s" % (venue, full_venue, password))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("metadata", help="metadata.yaml with the public info")
    parser.add_argument("duration", help="Contest duration in seconds", type=int)
    parser.add_argument("tasks", help="Task names, comma separated")
    parser.add_argument(
        "venues", help="CSV with venue,rooms (venue code, number of rooms)"
    )
    parser.add_argument("contestants", help="CSV with venue,name,surname,...")
    parser.add_argument(
        "output_dir",
        help="Output folder (will be created) where the venue yamls will be put",
    )
    parser.add_argument(
        "--description",
        help="Path to a markdown file with the description of the contest (overrides the description in the metadata)",
    )
    parser.add_argument(
        "--password",
        help="Zip password to use making the admin credentials",
    )
    parser.add_argument(
        "--demo",
        help="Generate demo credentials",
        action="store_true",
        default=False,
    )
    parser.add_argument(
        "--num-backup",
        help="Number of backup users to add in each venue",
        action="store",
        default=0,
        type=int,
    )
    parser.add_argument(
        "--window-duration",
        help="Duration of the window of each contestant",
        action="store",
        type=int,
    )
    main(parser.parse_args())
