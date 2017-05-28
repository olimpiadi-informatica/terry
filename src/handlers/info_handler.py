#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

import json

from .base_handler import BaseHandler
from ..validators import Validators
from ..database import Database

from datetime import datetime


class InfoHandler(BaseHandler):

    def get_contest(self):
        """
        GET /contest
        """
        start_timestamp = Database.get_meta("start_time", type=int)
        start_datetime = datetime.fromtimestamp(start_timestamp) if start_timestamp is not None else None
        now = datetime.now()

        if not start_timestamp or now < start_datetime:
            return {
                "has_started": False
            }

        return {
            "has_started": start_datetime.isoformat(),
            "tasks": Database.get_tasks()
        }

    @Validators.validate_during_contest
    @Validators.register_user_ip
    @Validators.validate_input_id
    def get_input(self, input):
        """
        GET /input/<input_id>
        """
        return BaseHandler.format_dates(input)

    @Validators.validate_during_contest
    @Validators.register_user_ip
    @Validators.validate_output_id
    def get_output(self, output):
        """
        GET /output/<output_id>
        """
        return InfoHandler.patch_output(output)

    @Validators.validate_during_contest
    @Validators.register_user_ip
    @Validators.validate_source_id
    def get_source(self, source):
        """
        GET /source/<source_id>
        """
        return BaseHandler.format_dates(source)

    @Validators.validate_during_contest
    @Validators.register_user_ip
    @Validators.validate_submission_id
    def get_submission(self, submission):
        """
        GET /submission/<submission_id>
        """
        return InfoHandler.patch_submission(submission)

    @Validators.validate_during_contest
    @Validators.register_user_ip
    @Validators.validate_token
    def get_user(self, user):
        """
        GET /user/<token>
        """
        token = user["token"]

        user["remaining_time"] = InfoHandler.get_remaining_time(user["extra_time"])
        del user["extra_time"]
        user["tasks"] = {}

        tasks = Database.get_user_task(token)
        for task in tasks:
            task_name = task["task"]

            if task["current_attempt"] is not None:
                current_input = Database.get_input(
                    token=token,
                    task=task_name,
                    attempt=task["current_attempt"]
                )
            else:
                current_input = None

            user["tasks"][task_name] = {
                "name": task_name,
                "score": task["score"],
                "current_input": current_input
            }

        return BaseHandler.format_dates(user, fields=["date"])

    @Validators.validate_during_contest
    @Validators.register_user_ip
    @Validators.validate_token
    @Validators.validate_task
    def get_submissions(self, user, task):
        """
        GET /user/<token>/submissions/<task>
        """
        submissions = []
        for sub in Database.get_submissions(user["token"], task["name"]):
            submissions.append(InfoHandler.patch_submission(sub))
        return { "items": submissions }

    @staticmethod
    def patch_submission(submission):
        """
        Given a submission from a SQL query with some JOIN create a dict by splitting the keys using _
        :param submission: A dict with the submission
        :return: A dict with some properties nested
        """
        result = {}

        for k, v in submission.items():
            if "_" in k:
                a, b = k.split("_")
                if a not in result: result[a] = {}
                result[a][b] = v
            else:
                result[k] = v

        result["feedback"] = json.loads(result["output"]["result"])["feedback"]
        temp = InfoHandler.patch_output(result["output"])

        del result["output"]
        result = BaseHandler.format_dates(result)
        result["output"] = temp

        return result

    @staticmethod
    def patch_output(output):
        """
        Given an output remove the private fields
        :param output: A dict from the outputs database table
        :return: The formatted and sanitized dict
        """
        result = {
            "id": output["id"],
            "date": output["date"],
            "path": output["path"],
            "size": output["size"],
            "validation": json.loads(output["result"])["validation"]
        }

        if "input" in output:
            result["input"] = output["input"]

        return BaseHandler.format_dates(result)
