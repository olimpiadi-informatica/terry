#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>
import json

from .info_handler import InfoHandler
from .base_handler import BaseHandler
from ..database import Database
from ..storage_manager import StorageManager
from ..contest_manager import ContestManager

from werkzeug.exceptions import Forbidden, BadRequest


class ContestHandler(BaseHandler):

    @staticmethod
    def compute_score(task, result):
        max_score = Database.get_task(task)["max_score"]
        percent = json.loads(result)["score"]
        return max_score * percent

    @staticmethod
    def update_user_score(token, task, score):
        task_score = Database.get_user_task(token, task)
        if task_score["score"] < score:
            Database.set_user_score(token, task, score, autocommit=False)

    def generate_input(self, token:str, task:str, _request):
        if Database.get_user(token) is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such user")
        if Database.get_task(task) is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such task")
        if Database.get_user_task(token, task)["current_attempt"] is not None:
            self.raise_exc(Forbidden, "FORBIDDEN", "You already have a ready input!")

        Database.register_ip(token, BaseHandler._get_ip(_request))

        attempt = Database.get_next_attempt(token, task)
        id, path = ContestManager.get_input(task, attempt)
        size = StorageManager.get_file_size(path)

        Database.begin()
        try:
            Database.add_input(id, token, task, attempt, path, size, autocommit=False)
            Database.set_user_attempt(token, task, attempt, autocommit=False)
            Database.commit()
        except:
            Database.rollback()
            raise
        return BaseHandler.format_dates(Database.get_input(id=id))

    def submit(self, input:str, output:str, source:str, _request):
        input = Database.get_input(input)
        if input is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such input file")
        output = Database.get_output(output)
        if output is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such output file")
        source = Database.get_source(source)
        if source is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such source file")

        token = input["token"]
        Database.register_ip(token, BaseHandler._get_ip(_request))

        score = ContestHandler.compute_score(input["task"], output["result"])
        Database.begin()
        try:
            submission_id = Database.gen_id()
            if not Database.add_submission(submission_id, input["id"], output["id"], source["id"],
                                           score, autocommit=False):
                self.raise_exc(BadRequest, "FORBIDDEN", "Error inserting the submission")
            ContestHandler.update_user_score(input["token"], input["task"], score)
            Database.set_user_attempt(input["token"], input["task"], None, autocommit=False)
            Database.commit()
        except:
            Database.rollback()
            raise
        return InfoHandler.patch_submission(Database.get_submission(submission_id))
