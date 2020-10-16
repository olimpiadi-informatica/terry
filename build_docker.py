#!/usr/bin/env python3

from typing import Optional
import argparse
import os
import shutil
import subprocess


def build_command(branch: str, tag: str, communication: Optional[str], rebuild: bool):
    # command to build the container
    cmd = ["docker", "build", "-t", tag, "."]

    if communication == "internal":
        print("[*] Building the communication backend")
        subprocess.check_call(
            ["cargo", "build", "--target", "x86_64-unknown-linux-musl", "--release"],
            cwd="communication",
        )
        print("[*] Copying backend binary into docker/ folder")
        shutil.copy(
            "communication/target/x86_64-unknown-linux-musl/release/terry-communication-backend",
            "docker/terry-communication-backend",
        )
        cmd += ["--build-arg", "REACT_APP_COMMUNICATIONS_BASE_URI=/api/communications/"]
    elif communication:
        cmd += ["--build-arg", "REACT_APP_COMMUNICATIONS_BASE_URI=" + communication]

    if branch:
        cmd += ["--build-arg", "TERRY_BRANCH=" + branch]

    if communication == "internal":
        cmd += ["-f", "Dockerfile.communication"]
    else:
        cmd += ["-f", "Dockerfile"]
    if rebuild:
        cmd += ["--no-cache"]

    print("[*] Building docker image")
    subprocess.check_call(cmd, cwd="docker")


def main(args: argparse.Namespace):
    build_command(args.branch, args.tag, args.communication, args.rebuild)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--branch", action="store", default="master", help="Branch of terry to use"
    )
    parser.add_argument(
        "--tag",
        action="store",
        default="terry:latest",
        help="Docker tag to use for the image",
    )
    parser.add_argument(
        "--communication",
        action="store",
        default=None,
        help="""
        Enable the communication backend and frontend. Possible values are: 'internal' or the URL with the APIs.
        If 'internal' is specified, the backend is also built and included in the container.
        """,
    )
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Rebuild the image even if its up to date",
    )

    args = parser.parse_args()
    main(args)
