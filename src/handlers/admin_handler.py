#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

from .base_handler import BaseHandler
from ..config import Config
from ..logger import Logger
from ..database import Database

from werkzeug.exceptions import InternalServerError, Forbidden


class AdminHandler(BaseHandler):
    def _validate_token(self, token:str):
        if Config.admin_token == Config.default_values['admin_token']:
            Logger.error("ADMIN", "Using default admin token!")
        if token != Config.admin_token:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                "Invalid admin token!")

    def extract(self, admin_token:str, filename:str, password:str):
        self._validate_token(admin_token)
        BaseHandler.raise_exc(InternalServerError, "SERVER_ERROR",
            "Feature not implemented yet")

    def log(self, start_date:str, end_date:str, level:str, category:str=None):
        self._validate_token(admin_token)
        start_date = datetime.strptime(start_date, "%Y-%m-%dT%H:%M:%S.%f").timestamp()
        end_date = datetime.strptime(end_date, "%Y-%m-%dT%H:%M:%S.%f").timestamp()
        return BaseHandler.format_dates({
            "items": Logger.get_logs(level, category, start_date, end_date)
        })

    def start(self, admin_token:str):
        self._validate_token(admin_token)
        if Database.get_meta("start_time", type=int) is not None:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                "Contest has already been started!")
        start_time = datetime.now().timestamp()
        Database.set_meta("start_time", start_time)
        return BaseHandler.format_dates(
            {"start_time": start_time},
            fields=["start_time"]
        )

    def set_extra_time(self, admin_token:str, extra_time:int, token:str=None):
        self._validate_token(admin_token)
        if token is None:
            Database.set_meta("extra_time", extra_time)
        else:
            Database.set_extra_time(token, extra_time)
        return {}

    def status(self, admin_token:str):
        self._validate_token(admin_token)
        start_time = Database.get_meta('start_time', type=int)
        extra_time = Database.get_meta('extra_time', type=int, default=0)
        remaining_time = BaseHandler._get_remaining_time(0)
        return BaseHandler.format_dates({
            "start_time": start_time,
            "extra_time": extra_time,
            "remaining_time": remaining_time
        }, fields=["start_time"])


    def user_list(self, admin_token:str):
        self._validate_token(admin_token)
        return BaseHandler.format_dates(
            {"items": Database.get_users()},
            fields=["first_login"]
        )
