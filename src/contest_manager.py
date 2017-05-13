#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

import gevent
import gevent.queue
import os
from .config import Config
from .database import Database
from .logger import Logger
from .storage_manager import StorageManager

from hashlib import sha256

class ContestManager:
    input_queue = dict()
    tasks = dict()

    @staticmethod
    def read_from_disk():
        # TODO: Really read from disk
        for task in Database.get_tasks():
            ContestManager.input_queue[task["name"]] = \
                    gevent.queue.Queue(Config.queue_size)
            ContestManager.tasks[task["name"]] = task

    @staticmethod
    def worker(task_name):
        """ Method that stays in the background and generates inputs """
        task = ContestManager.tasks[task_name]
        queue = ContestManager.input_queue[task_name]
        while True:
            id = Database.gen_id()
            path = StorageManager.new_input_file(id, task_name, "invalid")
            seed = int(sha256(id.encode()).hexdigest(), 16) % (2**31)
            stdout = os.open(
                StorageManager.get_absolute_path(path),
                os.O_WRONLY | os.O_CREAT, 0o644
            )
            # TODO: maybe log stderr, use real generator
            retcode = gevent.subprocess.call(
#                ["/bin/true", str(seed), "0"], stdout=stdout
                ["/bin/sleep", "1"], stdout=stdout
            )
            os.close(stdout)
            if retcode != 0:
                Logger.error(
                    "TASK",
                    "Error %d generating input %s (%d) for task %s" % \
                    (retcode, id, seed, task_name)
                )
                continue
            if "validator" in task:
                stdin = os.open(
                    StorageManager.get_absolute_path(path),
                    os.O_RDONLY
                )
                retcode = gevent.subprocess.call(
                    [task["validator"], "0"], stdin=stdin
                )
                os.close(stdin)
                if retcode != 0:
                    Logger.error(
                        "TASK",
                        "Error %d validating input %s (%d) for task %s" % \
                        (retcode, id, seed, task_name)
                    )
                    continue
            Logger.debug(
                "TASK",
                "Generated input %s (%d) for task %s" % \
                (id, seed, task_name)
            )
            queue.put({"id": id, "path": path})

    @staticmethod
    def start():
        for name in ContestManager.tasks:
            gevent.spawn(ContestManager.worker, name)

    @staticmethod
    def get_input(task_name, attempt):
        if ContestManager.input_queue[task_name].empty():
            Logger.warning("TASK", "Empty queue for task %s!" % task_name)
        input = ContestManager.input_queue[task_name].get()
        path = StorageManager.new_input_file(input["id"], task_name, attempt)
        StorageManager.rename_file(input["path"], path)
        return (input["id"], path)

    @staticmethod
    def evaluate_output(task_name, input_path, output_path):
        try:
            output = gevent.subprocess.check_call(
                ["/bin/true", input_path, output_path]
            )
        except:
            Logger.error(
                "TASK", "Error while evaluating output %s "
                "for task %s, with input %s: %s" %
                (output_path, task_name, input_path, traceback.format_exc())
            )
            raise
        Logger.debug(
            "TASK", "Evaluated output %s for task %s, with input %s"
            % (output_path, task_name, input_path)
        )
        return """
        {
            "score": 0.5,
            "validation": {
                "cases": [{ "status": "parsed" }, { "status": "missing" }],
                "alerts": [{ "severity": "warning", "message": "42 is the best number, you know that?" }]
            },
            "feedback": {
                "cases": [{ "correct": true }, { "correct": false }],
                "alerts": []
            }
        }
        """
