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
        input_id = route_args["id"]

        input_file = Database.get_input(id=input_id)
        if not input_file:
            self.raise_exc(Forbidden, "FORBIDDEN", "You cannot get the required input")
        return BaseHandler.format_dates(input_file)

    def get_output(self, route_args, request):
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
        source_id = route_args["id"]

        source_file = Database.get_source(id=source_id)
        if not source_file:
            self.raise_exc(Forbidden, "FORBIDDEN", "You cannot get the required source")

        return BaseHandler.format_dates(source_file)

    def get_submission(self, route_args, request):
        submission_id = route_args["id"]

        submission = Database.get_submission(submission_id)
        return BaseHandler.format_dates(InfoHandler._parse_submission(submission))

    @staticmethod
    def _parse_submission(submission):
        result = {}

        for k,v in submission.items():
            if "_" in k:
                a, b = k.split("_")
                if a not in result: result[a] = {}
                result[a][b] = v
            else:
                result[k] = v

        return result
