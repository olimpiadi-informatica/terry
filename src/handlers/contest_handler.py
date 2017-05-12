#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>
import json
import os
import os.path

from .base_handler import BaseHandler
from ..database import Database
from ..config import Config
from ..storage_manager import StorageManager

from gevent import monkey
monkey.patch_all()

from datetime import datetime
from werkzeug.exceptions import Forbidden, BadRequest

class ContestHandler(BaseHandler):
    def compute_score(self, task, result):
        max_score = Database.get_task(task)["max_score"]
        percent = json.loads(result)["score"]
        return max_score * percent

    def update_user_score(self, token, task, score):
        task_score = Database.get_user_task(token, task)
        if task_score.score < score:
            Database.set_user_score(token, task, score, autocommit=False)

    def generate_input(self, route_args, request):
        request_data = self.parse_body(request)
        if 'token' not in request_data or \
           'task' not in request_data:
             self.raise_exc(BadRequest, "BAD_REQUEST", "Data missing from the request")
        # TODO: register the IP address of the contestant
        token = request_data['token']
        task = request_data['task']
        if Database.get_user(token) is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such user")
        if Database.get_task(task) is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such task")
        if Database.get_user_task(token, task)["current_attempt"] is not None:
            self.raise_exc(Forbidden, "FORBIDDEN", "You already have a ready input!")
        # TODO: really generate the input
        id = Database.get_id()
        attempt = Database.get_next_attempt()
        path = StorageManager.new_input_file(id, task, attempt)
        with open(StorageManager.get_absolute_path(path), "w"):
            pass
        size = StorageManager.get_file_size(path)
        Database.begin()
        try:
            Database.add_input(token, task, attempt, path, size, autocommit=False)
            Database.set_user_attempt(token, task, attempt, autocommit=False)
            Database.commit()
        except:
            Database.rollback()
            raise
        return {"id": id}

    def submit(self, route_args, request):
        request_data = self.parse_body(request)
        if 'input' not in request_data or \
           'output' not in request_data or \
           'source' not in request_data:
             self.raise_exc(BadRequest, "BAD_REQUEST", "Data missing from the request")
        input = Database.get_output(request_data['input'])
        if input is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such input file")
        output = Database.get_output(request_data['output'])
        if output is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such output file")
        source = Database.get_output(request_data['source'])
        if source is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such source file")
        score = self.compute_score(input["task"], output["result"])
        Database.begin()
        try:
            id = Database.add_submission(input, output, source, score, autocommit=False)
            if id is None:
                self.raise_exc(BadRequest, "FORBIDDEN", "Error inserting the submission")
            self.update_user_score(input.token, input.task, score)
            self.set_user_attempt(input.token, input.task, None)
            Database.commit()
        except:
            Database.rollback()
            raise
        return {"id": id}
