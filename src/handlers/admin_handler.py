#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

import datetime
import os
import zipfile

from .base_handler import BaseHandler
from ..config import Config
from ..logger import Logger
from ..database import Database
from ..contest_manager import ContestManager
from ..validators import Validators

from werkzeug.exceptions import Forbidden, BadRequest


class AdminHandler(BaseHandler):

    @Validators.admin_only
    def extract(self, filename:str, password:str):
        """
        POST /admin/extract
        """
        if ContestManager.has_contest:
            self.raise_exc(Forbidden, "CONTEST", "Contest already loaded")
        os.makedirs(Config.contest_path, exist_ok=True)
        wd = os.getcwd()
        z = os.path.abspath(os.path.join(Config.contest_zips, filename))
        os.chdir(Config.contest_path)
        try:
            with zipfile.ZipFile(z) as f:
                f.extractall(pwd=password.encode())
            Logger.info("CONTEST", "Contest extracted")
        finally:
            os.chdir(wd)
        ContestManager.read_from_disk()
        ContestManager.start()
        return {}

    @Validators.admin_only
    def log(self, start_date:str, end_date:str, level:str, category:str=None):
        """
        POST /admin/log
        """
        if level not in Logger.HUMAN_MESSAGES:
            self.raise_exc(BadRequest, 'INVALID_PARAMETER', 'The level provided is invalid')
        level = Logger.HUMAN_MESSAGES.index(level)

        start_date = datetime.datetime.strptime(start_date, "%Y-%m-%dT%H:%M:%S.%f").timestamp()
        end_date = datetime.datetime.strptime(end_date, "%Y-%m-%dT%H:%M:%S.%f").timestamp()
        return BaseHandler.format_dates({
            "items": Logger.get_logs(level, category, start_date, end_date)
        })

    @Validators.admin_only
    def start(self):
        """
        POST /admin/start
        """
        if Database.get_meta("start_time", default=None, type=int) is not None:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "Contest has already been started!")

        start_time = int(datetime.datetime.now().timestamp())
        Database.set_meta("start_time", start_time)
        return BaseHandler.format_dates(
            {"start_time": start_time},
            fields=["start_time"]
        )

    @Validators.admin_only
    def set_extra_time(self, extra_time:int, token:str=None):
        """
        POST /admin/set_extra_time
        """
        if token is None:
            Database.set_meta("extra_time", extra_time)
        elif Database.get_user(token) is None:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "No such user")
        else:
            Database.set_extra_time(token, extra_time)
        return {}

    @Validators.admin_only
    def status(self):
        """
        POST /admin/status
        """
        start_time = Database.get_meta('start_time', type=int)
        extra_time = Database.get_meta('extra_time', type=int, default=0)
        remaining_time = BaseHandler.get_remaining_time(0)

        return BaseHandler.format_dates({
            "start_time": start_time,
            "extra_time": extra_time,
            "remaining_time": remaining_time,
            "loaded": ContestManager.has_contest
        }, fields=["start_time"])

    @Validators.admin_only
    def user_list(self):
        """
        POST /admin/user_list
        """
        return BaseHandler.format_dates({"items": Database.get_users()}, fields=["first_login"])
