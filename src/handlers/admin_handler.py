#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

import datetime
import os.path

from werkzeug.exceptions import Forbidden, BadRequest

from .base_handler import BaseHandler
from ..config import Config
from ..contest_manager import ContestManager
from ..crypto import combine_username_password
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
        if not Database.get_meta("admin_token"):
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                  "The pack has already been extracted")
        elif os.path.exists(Config.encrypted_file):
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                  "The pack has already been uploaded")

        StorageManager.save_file(Config.encrypted_file, file["content"])
        return {}

    def login(self, username: str, password: str, _ip):
        """
        POST /admin/login
        """
        admin_token = Database.get_meta("admin_token")
        token = combine_username_password(username, password)

        if not admin_token:
            ContestManager.extract_contest(username, password)
            admin_token = token

        if admin_token != token:
            Logger.warning("LOGIN_ADMIN", "Admin login failed from %s" % _ip)
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "Invalid admin "
                                                          "token!")
        return {}

    @Validators.admin_only
    def log(self, start_date: str, end_date: str, level: str,
            category: str = None):
        """
        POST /admin/log
        """
        if level not in Logger.HUMAN_MESSAGES:
            self.raise_exc(BadRequest, 'INVALID_PARAMETER',
                           'The level provided is invalid')
        level = Logger.HUMAN_MESSAGES.index(level)

        try:
            start_date = datetime.datetime.strptime(start_date,
                                                    "%Y-%m-%dT%H:%M:%S.%f").timestamp()
            end_date = datetime.datetime.strptime(end_date,
                                                  "%Y-%m-%dT%H:%M:%S.%f").timestamp()
        except ValueError as e:
            BaseHandler.raise_exc(BadRequest, "INVALID_PARAMETER", str(e))
        return BaseHandler.format_dates({
            "items": Logger.get_logs(level, category, start_date, end_date)
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
            {"start_time": start_time},
            fields=["start_time"]
        )

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
            Logger.info("ADMIN", "Extra time for user %s set to %d" % (
            user["token"], extra_time))
            Database.set_extra_time(user["token"], extra_time)
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
        return BaseHandler.format_dates({"items": Database.get_users()},
                                        fields=["first_date"])
