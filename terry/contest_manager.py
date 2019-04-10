#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2019 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017-2018 - Luca Versari <veluca93@gmail.com>
# Copyright 2018 - Massimo Cairo <cairomassimo@gmail.com>
# Copyright 2018 - William Di Luigi <williamdiluigi@gmail.com>
import os
import platform
import shutil
import time
import traceback
import zipfile
from hashlib import sha256

import gevent
import gevent.queue
import gevent.subprocess
import nacl.exceptions
import yaml
from contextlib import suppress
from werkzeug.exceptions import NotFound, Forbidden, InternalServerError

from terry.config import Config
from terry.crypto import decode_data, recover_file_password, decode, SECRET_LEN
from terry.database import Database
from terry.handlers.base_handler import BaseHandler
from terry.logger import Logger
from terry.storage_manager import StorageManager


class ContestManager:
    input_queue = dict()
    tasks = dict()
    has_contest = False

    @staticmethod
    def system_extension():
        """
        Get a file extension dependent of the system platform
        """
        return "." + platform.system().lower() + "." + platform.machine()

    @staticmethod
    def extract_contest(token):
        """
        Decrypt and extract the contest and store the used admin token in the
        database
        """

        if "-" not in token:
            BaseHandler.raise_exc(Forbidden, "WRONG_PASSWORD",
                                  "The provided password is malformed")

        try:
            username, password = token.split("-", 1)
            secret, scrambled_password = decode_data(password, SECRET_LEN)
            file_password = recover_file_password(username, secret,
                                                  scrambled_password)
        except ValueError:
            BaseHandler.raise_exc(Forbidden, "WRONG_PASSWORD",
                                  "The provided password is malformed")
        try:
            with open(Config.encrypted_file, "rb") as encrypted_file:
                encrypted_data = encrypted_file.read()
                decrypted_data = decode(file_password, encrypted_data)
                with open(Config.decrypted_file, "wb") as decrypted_file:
                    decrypted_file.write(decrypted_data)
        except FileNotFoundError:
            BaseHandler.raise_exc(NotFound, "NOT_FOUND",
                                  "The contest pack has not uploaded yet")
        except nacl.exceptions.CryptoError:
            BaseHandler.raise_exc(Forbidden, "WRONG_PASSWORD",
                                  "The provided password is wrong")
        except OSError as ex:
            BaseHandler.raise_exc(InternalServerError, "FAILED", str(ex))

        zip_abs_path = os.path.realpath(Config.decrypted_file)
        wd = os.getcwd()
        try:
            os.makedirs(Config.contest_path, exist_ok=True)
            os.chdir(Config.contest_path)
            with zipfile.ZipFile(zip_abs_path) as f:
                f.extractall()
            real_yaml = os.path.join('__users__', username + '.yaml')
            if not os.path.exists(real_yaml):
                BaseHandler.raise_exc(Forbidden, "WRONG_PASSWORD",
                                      "Invalid username for the given pack")
            os.symlink(real_yaml, 'contest.yaml')
            Logger.info("CONTEST", "Contest extracted")
        except zipfile.BadZipFile as ex:
            BaseHandler.raise_exc(Forbidden, "FAILED", str(ex))
        finally:
            os.chdir(wd)

        Database.set_meta("admin_token", token)

    @staticmethod
    def import_contest(path):
        """
        Import the contest coping the folders
        :param path: Path to the folder that contains contest.yaml
        :return: Returns the config of the contest
        """
        with open(os.path.join(path, "contest.yaml")) as f:
            contest_config = yaml.load(f)
        tasks = []
        os.makedirs(Config.statementdir, exist_ok=True)
        for task in contest_config["tasks"]:
            # copy the statement directory into the statement folder
            statementdir = os.path.join(Config.statementdir, task)
            web_statementdir = os.path.join(Config.web_statementdir, task)
            taskdir = os.path.join(path, task)
            if os.path.isdir(statementdir):
                shutil.rmtree(statementdir)
            if os.path.isfile(statementdir):
                os.remove(statementdir)
            shutil.copytree(os.path.join(taskdir, "statement"), statementdir)

            # load the task config
            with open(os.path.join(path, task, "task.yaml")) as f:
                task_config = yaml.load(f)

            checker = os.path.join(
                taskdir, "managers",
                "checker" + ContestManager.system_extension())
            generator = os.path.join(
                taskdir, "managers",
                "generator" + ContestManager.system_extension())
            validator = os.path.join(
                taskdir, "managers",
                "validator" + ContestManager.system_extension())
            task_config["checker"] = checker
            task_config["generator"] = generator

            # ensure the checker and the generator are executable
            os.chmod(checker, 0o755)
            os.chmod(generator, 0o755)

            # a task may not have a validator
            if os.path.exists(validator):
                task_config["validator"] = validator
                os.chmod(validator, 0o755)

            task_config["statement_path"] = os.path.join(
                web_statementdir, "statement.md")
            tasks.append(task_config)

        contest_config["tasks"] = tasks
        return contest_config

    @staticmethod
    def read_from_disk(remove_enc=True):
        """
        Load a task from the disk and load the data into the database
        """
        try:
            contest = ContestManager.import_contest(Config.contest_path)
        except FileNotFoundError as ex:
            Logger.info(
                "CONTEST", "Contest not found, you probably need to "
                "unzip it. Missing file %s" % ex.filename)
            shutil.rmtree(Config.statementdir, ignore_errors=True)
            shutil.rmtree(Config.web_statementdir, ignore_errors=True)
            shutil.rmtree(Config.contest_path, ignore_errors=True)
            if remove_enc:
                with suppress(Exception):
                    os.remove(Config.encrypted_file)
            with suppress(Exception):
                os.remove(Config.decrypted_file)
            Database.del_meta("admin_token")
            return

        if not Database.get_meta("contest_imported", default=False, type=bool):
            Database.begin()
            try:
                Database.set_meta(
                    "contest_duration", contest["duration"], autocommit=False)
                Database.set_meta(
                    "contest_name",
                    contest.get("name", "Contest"),
                    autocommit=False)
                Database.set_meta(
                    "contest_description",
                    contest.get("description", ""),
                    autocommit=False)
                Database.set_meta(
                    "window_duration",
                    # if None the contest is not USACO-style
                    contest.get("window_duration"),
                    autocommit=False)
                count = 0

                for task in contest["tasks"]:
                    Database.add_task(
                        task["name"],
                        task["description"],
                        task["statement_path"],
                        task["max_score"],
                        count,
                        autocommit=False)
                    count += 1

                for user in contest["users"]:
                    Database.add_user(
                        user["token"],
                        user["name"],
                        user["surname"],
                        autocommit=False)

                for user in Database.get_users():
                    for task in Database.get_tasks():
                        Database.add_user_task(
                            user["token"], task["name"], autocommit=False)

                Database.set_meta("contest_imported", True, autocommit=False)
                Database.commit()
            except:
                Database.rollback()
                raise
        else:
            # TODO: check that the contest is still the same
            pass

        # store the task in the ContestManager singleton
        ContestManager.tasks = dict(
            (task["name"], task) for task in contest["tasks"])
        ContestManager.has_contest = True

        # create the queues for the task inputs
        for task in ContestManager.tasks:
            ContestManager.input_queue[task] = gevent.queue.Queue(
                Config.queue_size)
            gevent.spawn(ContestManager.worker, task)

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
                    os.O_WRONLY | os.O_CREAT, 0o644)

                try:
                    start_time = time.monotonic()
                    # generate the input and store the stdout into a file
                    retcode = gevent.subprocess.call(
                        [task["generator"], str(seed), "0"], stdout=stdout)
                    if time.monotonic() > start_time + 1:
                        Logger.warning(
                            "TASK",
                            "Generation of input %s for task %s took %f seconds"
                            % (seed, task_name, time.monotonic() - start_time))
                finally:
                    os.close(stdout)

                if retcode != 0:
                    Logger.error(
                        "TASK",
                        "Error %d generating input %s (%d) for task %s" % \
                        (retcode, id, seed, task_name)
                    )
                    # skip the input
                    continue

                # if there is a validator in the task use it to check if the
                # generated input is valid
                if "validator" in task:
                    stdin = os.open(
                        StorageManager.get_absolute_path(path), os.O_RDONLY)
                    try:
                        start_time = time.monotonic()
                        # execute the validator piping the input file to stdin
                        retcode = gevent.subprocess.call(
                            [task["validator"], "0"], stdin=stdin)
                        if time.monotonic() > start_time + 1:
                            Logger.warning(
                                "TASK",
                                "Validation of input %s for task %s took %f "
                                "seconds" % (seed, task_name,
                                             time.monotonic() - start_time))
                    finally:
                        os.close(stdin)

                    if retcode != 0:
                        Logger.error(
                            "TASK",
                            "Error %d validating input %s (%d) for task %s" % \
                            (retcode, id, seed, task_name)
                        )
                        # skip the input
                        continue

                Logger.debug(
                    "TASK",
                    "Generated input %s (%d) for task %s" % \
                    (id, seed, task_name)
                )
                # this method is blocking if the queue is full
                queue.put({"id": id, "path": path})
            except:
                Logger.error(
                    "TASK", "Exception while creating an input file: " +
                    traceback.format_exc())

    @staticmethod
    def get_input(task_name, attempt):
        """
        Fetch an input from the queue and properly rename it
        :param task_name: Name of the task
        :param attempt: Number of the attempt for the user
        :return: A pair, the first element is the id of the input file,
        the second the path
        """
        if ContestManager.input_queue[task_name].empty():
            Logger.warning("TASK", "Empty queue for task %s!" % task_name)

        input = ContestManager.input_queue[task_name].get()
        path = StorageManager.new_input_file(input["id"], task_name, attempt)
        StorageManager.rename_file(input["path"], path)

        return input["id"], path

    @staticmethod
    def evaluate_output(task_name, input_path, output_path):
        """
        Given an input of a task, evaluate the correctness of the output
        :param task_name: Name of the task
        :param input_path: Path to the user's input file
        :param output_path: Path to the user's output file
        :return: The stdout of the checker
        """
        try:
            # call the checker and store the output
            start_time = time.monotonic()
            output = gevent.subprocess.check_output([
                ContestManager.tasks[task_name]["checker"],
                StorageManager.get_absolute_path(input_path),
                StorageManager.get_absolute_path(output_path)
            ])
            if time.monotonic() > start_time + 1:
                Logger.warning(
                    "TASK", "Evaluation of output %s "
                    "for task %s, with input %s, took %f "
                    "seconds" % (output_path, task_name, input_path,
                                 time.monotonic() - start_time))
        except:
            # TODO log the stdout and stderr of the checker
            Logger.error(
                "TASK", "Error while evaluating output %s "
                "for task %s, with input %s: %s" %
                (output_path, task_name, input_path, traceback.format_exc()))
            raise
        Logger.info(
            "TASK", "Evaluated output %s for task %s, with input %s" %
            (output_path, task_name, input_path))
        return output
