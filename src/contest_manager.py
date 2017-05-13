#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

import gevent
import gevent.queue
import os
import platform
import shutil
import traceback
import yaml

from .config import Config
from .database import Database
from .logger import Logger
from .storage_manager import StorageManager

from hashlib import sha256


class ContestManager:
    input_queue = dict()
    tasks = dict()

    @staticmethod
    def system_extension():
        return "." + platform.system().lower() + "." + platform.machine()

    @staticmethod
    def import_contest(path):
        with open(os.path.join(path, "contest.yaml")) as f:
            contest_config = yaml.load(f)
        tasks = []
        os.makedirs(Config.statementdir, exist_ok=True)
        for task in contest_config["tasks"]:
            statementdir = os.path.join(Config.statementdir, task)
            taskdir = os.path.join(path, task)
            if not os.path.isdir(statementdir):
                if os.path.exists(statementdir):
                    shutil.rmtree(statementdir)
                shutil.copytree(
                    os.path.join(taskdir, "statement"),
                    statementdir
                )
            with open(os.path.join(path, task, "task.yaml")) as f:
                task_config = yaml.load(f)
            checker = os.path.join(
                    taskdir,
                    "managers",
                    "checker" + ContestManager.system_extension()
                )
            generator = os.path.join(
                    taskdir,
                    "managers",
                    "generator" + ContestManager.system_extension()
                )
            validator = os.path.join(
                    taskdir,
                    "managers",
                    "validator" + ContestManager.system_extension()
                )
            task_config["checker"] = checker
            task_config["generator"] = generator
            if os.path.exists(validator):
                task_config["validator"] = validator
            task_config["statement_path"] = \
                os.path.join(statementdir, "statement.md")
            tasks.append(task_config)
        contest_config["tasks"] = tasks
        return contest_config


    @staticmethod
    def read_from_disk():
        contest = ContestManager.import_contest(Config.contest_path)
        if not Database.get_meta("contest_imported", default=False, type=bool):
            Database.begin()
            try:
                Database.set_meta(
                    "contest_duration", contest["duration"],
                    autocommit=False
                )
                count = 0
                for task in contest["tasks"]:
                    Database.add_task(
                        task["name"], task["description"], task["statement_path"],
                        task["max_score"], count, autocommit=False
                    )
                    count += 1
                for user in contest["users"]:
                    Database.add_user(
                        user["token"], user["name"],
                        user["surname"], autocommit=False
                    )
                for user in Database.get_users():
                    for task in Database.get_tasks():
                        Database.add_user_task(
                            user["token"], task["name"],
                            autocommit=False
                        )
                Database.set_meta(
                    "contest_imported", True,
                    autocommit=False
                )
                Database.commit()
            except:
                Database.rollback()
                raise
        else:
            # TODO: check that the contest is still the same
            pass
        ContestManager.tasks = dict(
            (task["name"], task) for task in contest["tasks"]
        )
        for task in ContestManager.tasks:
            ContestManager.input_queue[task] = \
                    gevent.queue.Queue(Config.queue_size)

    @staticmethod
    def worker(task_name):
        """ Method that stays in the background and generates inputs """
        task = ContestManager.tasks[task_name]
        queue = ContestManager.input_queue[task_name]
        while True:
            try:
                id = Database.gen_id()
                path = StorageManager.new_input_file(id, task_name, "invalid")
                seed = int(sha256(id.encode()).hexdigest(), 16) % (2**31)
                stdout = os.open(
                    StorageManager.get_absolute_path(path),
                    os.O_WRONLY | os.O_CREAT, 0o644
                )
                # TODO: maybe log stderr, use real generator
                retcode = gevent.subprocess.call(
                    [task["generator"], str(seed), "0"], stdout=stdout
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
            except:
                Logger.error(
                    "TASK", "Exception while creating an input file: "
                    + traceback.format_exc()
                )

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
        return input["id"], path

    @staticmethod
    def evaluate_output(task_name, input_path, output_path):
        try:
            output = gevent.subprocess.check_output([
                ContestManager.tasks[task_name]["checker"],
                StorageManager.get_absolute_path(input_path),
                StorageManager.get_absolute_path(output_path)
            ])
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
        return output
