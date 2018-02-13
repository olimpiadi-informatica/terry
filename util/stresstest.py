#!/usr/bin/env python3

import argparse
from requests import post
import sys
from io import StringIO
import time

stopped = False

def get_input(args):
    while True:
        gen_input = post("%s/generate_input" % args.host, data={"token": args.token, "task": args.task})
        code = gen_input.status_code
        if code >= 500:
            pass
        elif 400 <= code <= 499:
            print("Failed", gen_input)
            print(gen_input.content)
            sys.exit(1)
        else:
            print("i", end="")
            return gen_input.json()["id"]

def send_file(url, data, filedata):
    while True:
        upload = post(url, files={"file": StringIO(filedata)}, data=data)
        code = upload.status_code
        if code >= 500:
            pass
        elif 400 <= code <= 499:
            print("Failed", upload)
            print(upload.content)
            sys.exit(1)
        else:
            print("u", end="")
            return upload.json()["id"]

def submit(args, output_id, source_id):
    req = post("%s/submit" % args.host, data={"token": args.token, "output_id": output_id, "source_id": source_id})
    code = req.status_code
    if code >= 500:
        print(".", end="")
    elif 400 <= code <= 499:
        print("Failed", req)
        print(req.content)
        sys.exit(1)
    print("s")


def stress(args):
    try:
        last_time = time.monotonic()
        while not stopped:
            input_id = get_input(args)
            output_id = send_file("%s/upload_output" % args.host, {"input_id": input_id, "token": args.token}, "lallabalalla")
            source_id = send_file("%s/upload_source" % args.host, {"input_id": input_id, "token": args.token}, "lallabalalla")
            submit(args, output_id, source_id)
            current = time.monotonic()
            delta = current - last_time
            print("======= %f" % delta)
            last_time = current
    except KeyboardInterrupt:
        return

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("host", help="Address of the APIs", action="store")
    parser.add_argument("token", help="Token of the user", action="store")
    parser.add_argument("task", help="Name of the task", action="store")
    args = parser.parse_args()
    stress(args)

if __name__ == "__main__":
    main()
