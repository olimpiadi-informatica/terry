#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2019 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>
# Copyright 2017 - Massimo Cairo <cairomassimo@gmail.com>
import json
import sqlite3
import time
from datetime import datetime, timezone

from werkzeug.exceptions import Forbidden, BadRequest

from terry.contest_manager import ContestManager
from terry.database import Database
from terry.handlers.base_handler import BaseHandler
from terry.handlers.info_handler import InfoHandler
from terry.logger import Logger
from terry.storage_manager import StorageManager
from terry.validators import Validators


class ContestHandler(BaseHandler):
    @staticmethod
    def compute_score(task, result):
        max_score = Database.get_task(task)["max_score"]
        percent = json.loads(result.decode())["score"]
        return max_score * percent

    @staticmethod
    def update_user_score(token, task, score):
        task_score = Database.get_user_task(token, task)
        if task_score["score"] < score:
            Database.set_user_score(token, task, score, autocommit=False)

    @Validators.during_contest
    @Validators.register_user_ip
    @Validators.validate_token
    @Validators.validate_task
    def generate_input(self, task, user):
        """
        POST /generate_input
        """
        token = user["token"]
        if Database.get_user_task(token, task["name"])["current_attempt"]:
            self.raise_exc(Forbidden, "FORBIDDEN", "You already have a ready input!")

        attempt = Database.get_next_attempt(token, task["name"])
        id, path = ContestManager.get_input(task["name"], attempt)
        size = StorageManager.get_file_size(path)

        Database.begin()
        try:
            Database.add_input(
                id, token, task["name"], attempt, path, size, autocommit=False
            )
            Database.set_user_attempt(token, task["name"], attempt, autocommit=False)
            Database.commit()
        except:
            Database.rollback()
            raise
        Logger.info(
            "CONTEST",
            "Generated input %s for user %s on task %s" % (id, token, task["name"]),
        )
        return BaseHandler.format_dates(Database.get_input(id=id))

    @Validators.during_contest
    @Validators.register_user_ip
    @Validators.validate_output_id
    @Validators.validate_source_id
    def submit(self, output, source):
        """
        POST /submit
        """
        input = Database.get_input(output["input"])
        if input is None:
            Logger.warning(
                "DB_CONSISTENCY_ERROR", "Input %s not found in the db" % output["input"]
            )
            self.raise_exc(BadRequest, "WRONG_INPUT", "The provided input in invalid")
        if output["input"] != source["input"]:
            Logger.warning(
                "POSSIBLE_CHEAT", "Trying to submit wrong pair source-output"
            )
            self.raise_exc(
                Forbidden,
                "WRONG_OUTPUT_SOURCE",
                "The provided pair of source-output is invalid",
            )

        expiry_date = ContestManager.get_input_expiry_date(input)
        if expiry_date is not None and datetime.now(timezone.utc).timestamp() > expiry_date:
            Logger.info(
                "UPLOAD",
                "User %s tried to submit for input %s too late"
                % (input["token"], input["id"]),
            )
            BaseHandler.raise_exc(
                Forbidden, "INPUT_EXPIRED", "The input file has expired"
            )

        score = ContestHandler.compute_score(input["task"], output["result"])
        submission_id = self.add_submission(input, output, source, score)

        Logger.info(
            "CONTEST",
            "User %s has submitted %s on %s"
            % (input["token"], submission_id, input["task"]),
        )
        return InfoHandler.patch_submission(Database.get_submission(submission_id))

    @Validators.during_contest
    @Validators.register_user_ip
    @Validators.validate_input_id
    def abandon_input(self, input):
        """
        POST /abandon_input
        """
        Database.begin()
        try:
            Database.set_user_attempt(
                input["token"], input["task"], None, autocommit=False
            )
            Database.commit()
        except:
            Database.rollback()
            raise

        Logger.info(
            "CONTEST",
            "User %s has abandoned input %s on %s"
            % (input["token"], input["id"], input["task"]),
        )

    def add_submission(self, input, output, source, score):
        Database.begin()
        try:
            submission_id = Database.gen_id()
            if not Database.add_submission(
                submission_id,
                input["id"],
                output["id"],
                source["id"],
                score,
                autocommit=False,
            ):
                self.raise_exc(
                    BadRequest, "INTERNAL_ERROR", "Error inserting the submission"
                )
            ContestHandler.update_user_score(input["token"], input["task"], score)
            Database.set_user_attempt(
                input["token"], input["task"], None, autocommit=False
            )
            Database.commit()
        except sqlite3.IntegrityError as ex:
            Database.rollback()
            # provide a better error message if the input has already been
            # submitted
            if "UNIQUE constraint failed: submissions.input" in str(ex):
                self.raise_exc(
                    Forbidden,
                    "ALREADY_SUBMITTED",
                    "This input has already been submitted",
                )
            raise
        except:
            Database.rollback()
            raise

        return submission_id

    @Validators.register_user_ip
    def internet_detected(self, token):
        """
        POST /internet_detected
        """
        Logger.warning(
            "INTERNET_DETECTED", "User %s has been detected with internet!" % token
        )
