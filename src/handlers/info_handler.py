#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import json

from .base_handler import BaseHandler
from ..database import Database

from datetime import datetime
from werkzeug.exceptions import Forbidden


class InfoHandler(BaseHandler):

    def get_contest(self, route_args, request):
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

    def get_input(self, route_args, request):
        """
        GET /input/<id>
        """
        input_id = route_args["id"]

        input_file = Database.get_input(id=input_id)
        if not input_file:
            self.raise_exc(Forbidden, "FORBIDDEN", "You cannot get the required input")
        return BaseHandler.format_dates(input_file)

    def get_output(self, route_args, request):
        """
        GET /output/<id>
        """
        output_id = route_args["id"]

        output_file = Database.get_output(id=output_id)
        if not output_file:
            self.raise_exc(Forbidden, "FORBIDDEN", "You cannot get the required output")

        # patch the date to the correct format
        result = {
            "id": output_file["id"],
            "input": output_file["input"],
            "date": output_file["date"],
            "path": output_file["path"]
        }
        if output_file["result"]:
            result["result"] = json.loads(output_file["result"])["validation"]

        return BaseHandler.format_dates(result)

    def get_source(self, route_args, request):
        """
        GET /source/<id>
        """
        source_id = route_args["id"]

        source_file = Database.get_source(id=source_id)
        if not source_file:
            self.raise_exc(Forbidden, "FORBIDDEN", "You cannot get the required source")

        return BaseHandler.format_dates(source_file)

    def get_submission(self, route_args, request):
        """
        GET /submission/<id>
        """
        submission_id = route_args["id"]

        submission = Database.get_submission(submission_id)
        return BaseHandler.format_dates(InfoHandler._parse_submission(submission))

    def get_user(self, route_args, request):
        """
        GET /user/<token>
        """
        token = route_args["token"]

        user = Database.get_user(token)
        if user is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "Invalid login")

        # TODO fix this
        user["remaining_time"] = InfoHandler._get_remaining_time(user["extra_time"])
        del user["first_login"]
        del user["extra_time"]
        user["tasks"] = {}

        tasks = Database.get_user_task(token)
        for task in tasks:
            task_name = task["task"]

            if task["current_attempt"] is not None:
                current_input = Database.get_input(token=token, task=task_name, attempt=task["current_attempt"])
            else:
                current_input = None

            user["tasks"][task_name] = {
                "name": task_name,
                "score": task["score"],
                "current_input": current_input
            }

        return BaseHandler.format_dates(user, fields=["date", "contest_end"])

    def get_submissions(self, route_args, request):
        """
        GET /user/<token>/submissions/<task>
        """
        token = route_args["token"]
        task = route_args["task"]

        submissions = []
        for sub in Database.get_submissions(token, task):
            submissions.append(BaseHandler.format_dates(InfoHandler._parse_submission(sub)))
        return submissions

    @staticmethod
    def _parse_submission(submission):
        """
        Given a submission from a SQL query with some JOIN create a dict by splitting the keys using _
        :param submission: A dict with the submission
        :return: A dict with some properties nested
        """
        result = {}

        for k,v in submission.items():
            if "_" in k:
                a, b = k.split("_")
                if a not in result: result[a] = {}
                result[a][b] = v
            else:
                result[k] = v

        return result

    @staticmethod
    def _get_remaining_time(user_extra_time):
        """
        Compute the remaining time for a user
        :param user_extra_time: Extra time specific for the user in seconds
        :return: The number of seconds until the contest is finished
        """
        start = Database.get_meta('start_time', type=int)
        contest_duration = Database.get_meta('contest_duration', type=int)
        contest_extra_time = Database.get_meta('extra_time', type=int, default=0)
        now = int(datetime.now().timestamp())

        return start + contest_duration - now + contest_extra_time + user_extra_time
