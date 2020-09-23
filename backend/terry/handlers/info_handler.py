#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2019 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017-2018 - Luca Versari <veluca93@gmail.com>
# Copyright 2017-2018 - Massimo Cairo <cairomassimo@gmail.com>
# Copyright 2018 - William Di Luigi <williamdiluigi@gmail.com>

import json
from datetime import datetime

from terry.handlers.base_handler import BaseHandler
from terry.database import Database
from terry.validators import Validators


class InfoHandler(BaseHandler):
    def get_contest(self):
        """
        GET /contest
        """
        start_timestamp = Database.get_meta("start_time", type=int)
        start_datetime = datetime.fromtimestamp(
            start_timestamp) if start_timestamp is not None else None
        now = datetime.now()

        if not start_timestamp or now < start_datetime:
            return {
                "has_started": False,
                "name": Database.get_meta("contest_name"),
                "description": Database.get_meta("contest_description")
            }

        tasks = Database.get_tasks()
        return {
            "has_started": True,
            "name": Database.get_meta("contest_name"),
            "description": Database.get_meta("contest_description"),
            "start_time": start_datetime.isoformat(),
            "tasks": tasks,
            "max_total_score": sum(task["max_score"] for task in tasks)
        }

    @Validators.contest_started
    @Validators.register_user_ip
    @Validators.validate_input_id
    def get_input(self, input):
        """
        GET /input/<input_id>
        """
        return BaseHandler.format_dates(input)

    @Validators.contest_started
    @Validators.register_user_ip
    @Validators.validate_output_id
    def get_output(self, output):
        """
        GET /output/<output_id>
        """
        return InfoHandler.patch_output(output)

    @Validators.contest_started
    @Validators.register_user_ip
    @Validators.validate_source_id
    def get_source(self, source):
        """
        GET /source/<source_id>
        """
        return BaseHandler.format_dates(source)

    @Validators.contest_started
    @Validators.register_user_ip
    @Validators.validate_submission_id
    def get_submission(self, submission):
        """
        GET /submission/<submission_id>
        """
        return InfoHandler.patch_submission(submission)

    @Validators.register_user_ip
    @Validators.validate_token
    def get_user(self, user):
        """
        GET /user/<token>
        """
        token = user["token"]

        user["contest"] = self.get_contest()

        if not user["contest"]["has_started"]:
            del user["extra_time"]
            return user

        end_time = InfoHandler.get_end_time(user["extra_time"])
        if user["contest_start_delay"] is not None:
            end_time = min(
                end_time,
                InfoHandler.get_window_end_time(user["extra_time"],
                                                user["contest_start_delay"]))

        user["end_time"] = end_time
        del user["extra_time"]
        user["tasks"] = {}

        tasks = Database.get_user_task(token)
        for task in tasks:
            task_name = task["task"]

            if task["current_attempt"] is not None:
                current_input = Database.get_input(
                    token=token,
                    task=task_name,
                    attempt=task["current_attempt"])
            else:
                current_input = None

            user["tasks"][task_name] = {
                "name": task_name,
                "score": task["score"],
                "current_input": current_input
            }

        user["total_score"] = sum(task["score"] for task in tasks)

        return BaseHandler.format_dates(user, fields=["end_time"])

    @Validators.contest_started
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
        return {"items": submissions}

    @staticmethod
    def patch_submission(submission):
        """
        Given a submission from a SQL query with some JOIN create a dict by
        splitting the keys using _
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

        feedback = json.loads(result["output"]["result"].decode())
        result["feedback"] = feedback["feedback"]
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
            "validation": json.loads(output["result"].decode())["validation"]
        }

        if "input" in output:
            result["input"] = output["input"]

        return BaseHandler.format_dates(result)
