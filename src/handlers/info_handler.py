#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

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
        # patch the date to the correct format
        input_file["date"] = datetime.fromtimestamp(input_file["date"]).isoformat()
        return input_file

    def get_output(self, route_args, request):
        output_id = route_args["id"]

        output_file = Database.get_output(id=output_id)
        if not output_file:
            self.raise_exc(Forbidden, "FORBIDDEN", "You cannot get the required output")

        # patch the date to the correct format
        result = {
            "id": output_file["id"],
            "input": output_file["input"],
            "date": datetime.fromtimestamp(output_file["date"]).isoformat(),
            "path": output_file["path"]
        }
        if output_file["result"]:
            result["result"] = output_file["result"]

        return result

    def get_source(self, route_args, request):
        source_id = route_args["id"]

        source_file = Database.get_source(id=source_id)
        if not source_file:
            self.raise_exc(Forbidden, "FORBIDDEN", "You cannot get the required source")
        # patch the date to the correct format
        source_file["date"] = datetime.fromtimestamp(source_file["date"]).isoformat()
        return source_file
