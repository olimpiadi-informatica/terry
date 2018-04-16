import random
import subprocess
import tempfile
import time
import os.path
import json

def get_output(command, stdin=None):
    proc = subprocess.Popen(command, stdout=subprocess.PIPE,
                            stdin=subprocess.PIPE)
    stdout, stderr = proc.communicate(stdin)
    return stdout.decode()


def evaluate(generator, validator, checker, solution):
    workdir = tempfile.TemporaryDirectory()
    seed = str(random.randint(0, 2**32))
    input = os.path.join(workdir.name, "input.txt")
    output = os.path.join(workdir.name, "output.txt")

    start = time.monotonic()
    with open(input, "w") as f:
        f.write(get_output([generator, seed, "0"]))
    generated = time.monotonic()
    if validator:
        with open(input, "rb") as f:
            get_output([validator, "0"], f.read())
    validated = time.monotonic()
    with open(output, "w") as f:
        with open(input, "rb") as i:
            f.write(get_output([solution], i.read()))
    solved = time.monotonic()
    check = get_output([checker, input, output])
    checked = time.monotonic()

    data = json.loads(check)
    score = data["score"]
    return score, generated-start, validated-generated, solved-validated, checked-solved


def get_stats(lst, index):
    min_val = min(x[index] for x in lst)
    max_val = max(x[index] for x in lst)
    avg_val = sum(x[index] for x in lst) / len(lst)
    return min_val, max_val, avg_val
