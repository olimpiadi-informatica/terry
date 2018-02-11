#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

import datetime
import os.path
import subprocess
import tempfile

import gevent
from werkzeug.exceptions import Forbidden, BadRequest

from .base_handler import BaseHandler
from ..config import Config
from ..contest_manager import ContestManager
from ..database import Database
from ..logger import Logger
from ..storage_manager import StorageManager
from ..validators import Validators


class AdminHandler(BaseHandler):
    @Validators.validate_file
    def upload_pack(self, file):
        """
        POST /admin/upload_pack
        """
        if Database.get_meta("admin_token"):
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                  "The pack has already been extracted")
        elif os.path.exists(Config.encrypted_file):
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                  "The pack has already been uploaded")

        StorageManager.save_file(
            os.path.realpath(Config.encrypted_file), file["content"])
        return {}

    @Validators.admin_only
    def download_pack(self):
        """
        POST /admin/download_pack
        """
        Logger.info("ADMIN", "Creating zip file")
        zip_directory = os.path.join(Config.storedir, "zips")
        os.makedirs(zip_directory, exist_ok=True)
        zip_directory = tempfile.mkdtemp(dir=zip_directory)
        zipf_name = os.path.join(zip_directory, "results.zip")
        command = "zip -r " + zipf_name + " db.sqlite3* log.sqlite3* files/input files/output files/source"

        try:
            output = gevent.subprocess.check_output(
                command, shell=True, stderr=subprocess.STDOUT)
        except gevent.subprocess.CalledProcessError as e:
            Logger.error("ADMIN", "Zip error: %s" % e.output)
            raise e
        return {"path": os.path.relpath(zipf_name, Config.storedir)}

    def append_log(self, append_log_secret: str, level: str, category: str,
                   message: str):
        """
        POST /admin/append_log
        """
        if append_log_secret != Config.append_log_secret:
            self.raise_exc(Forbidden, "FORBIDDEN", "Invalid append log secret")
        if level not in Logger.HUMAN_MESSAGES:
            self.raise_exc(BadRequest, 'INVALID_PARAMETER',
                           'The level provided is invalid')
        level = Logger.HUMAN_MESSAGES.index(level)
        Logger.log(level, category, message)

    @Validators.admin_only
    def log(self,
            start_date: str,
            end_date: str,
            level: str,
            category: str = None):
        """
        POST /admin/log
        """
        if level not in Logger.HUMAN_MESSAGES:
            self.raise_exc(BadRequest, 'INVALID_PARAMETER',
                           'The level provided is invalid')
        level = Logger.HUMAN_MESSAGES.index(level)

        try:
            start_date = datetime.datetime.strptime(
                start_date, "%Y-%m-%dT%H:%M:%S.%f").timestamp()
            end_date = datetime.datetime.strptime(
                end_date, "%Y-%m-%dT%H:%M:%S.%f").timestamp()
        except ValueError as e:
            BaseHandler.raise_exc(BadRequest, "INVALID_PARAMETER", str(e))
        return BaseHandler.format_dates({
            "items":
            Logger.get_logs(level, category, start_date, end_date)
        })

    @Validators.admin_only
    def start(self):
        """
        POST /admin/start
        """
        if Database.get_meta("start_time", default=None, type=int) is not None:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                  "Contest has already been started!")

        ContestManager.start()
        start_time = int(datetime.datetime.now().timestamp())
        Database.set_meta("start_time", start_time)
        Logger.info("CONTEST", "Contest started")
        return BaseHandler.format_dates(
            {
                "start_time": start_time
            }, fields=["start_time"])

    @Validators.admin_only
    @Validators.validate_id("token", "user", Database.get_user, required=False)
    def set_extra_time(self, extra_time: int, user):
        """
        POST /admin/set_extra_time
        """
        if user is None:
            Database.set_meta("extra_time", extra_time)
            Logger.info("ADMIN", "Global extra time set to %d" % extra_time)
        else:
            Logger.info("ADMIN", "Extra time for user %s set to %d" %
                        (user["token"], extra_time))
            Database.set_extra_time(user["token"], extra_time)
        return {}

    @Validators.admin_only
    def status(self):
        """
        POST /admin/status
        """
        start_time = Database.get_meta('start_time', type=int)
        extra_time = Database.get_meta('extra_time', type=int, default=0)
        end_time = BaseHandler.get_end_time(0)

        return BaseHandler.format_dates(
            {
                "start_time": start_time,
                "extra_time": extra_time,
                "end_time": end_time,
                "loaded": ContestManager.has_contest
            },
            fields=["start_time"])

    @Validators.admin_only
    def user_list(self):
        """
        POST /admin/user_list
        """
        return BaseHandler.format_dates(
            {
                "items": Database.get_users()
            }, fields=["first_date"])
