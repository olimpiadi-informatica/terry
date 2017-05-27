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

from werkzeug.exceptions import Forbidden, BadRequest


class AdminHandler(BaseHandler):

    def _validate_token(self, token, ip):
        """
        Assert the admin token is valid
        :param token: Token to check
        :param ip: IP of the client
        """
        if Config.admin_token == Config.default_values['admin_token']:
            Logger.error("ADMIN", "Using default admin token!")
        if token != Config.admin_token:
            Logger.warning("LOGIN_ADMIN", "Admin login failed from %s" % ip)
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "Invalid admin token!")
        else:
            if Database.register_admin_ip(ip):
                Logger.warning("LOGIN_ADMIN", "An admin has connected from a new ip: %s" % ip)

    def extract(self, admin_token:str, filename:str, password:str, _ip):
        """
        POST /admin/extract
        """
        self._validate_token(admin_token, _ip)
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

    def log(self, start_date:str, end_date:str, level:str, admin_token:str, _ip, category:str=None):
        """
        POST /admin/log
        """
        self._validate_token(admin_token, _ip)
        if level not in Logger.HUMAN_MESSAGES:
            self.raise_exc(BadRequest, 'INVALID_PARAMETER', 'The level provided is invalid')
        level = Logger.HUMAN_MESSAGES.index(level)

        start_date = datetime.datetime.strptime(start_date, "%Y-%m-%dT%H:%M:%S.%f").timestamp()
        end_date = datetime.datetime.strptime(end_date, "%Y-%m-%dT%H:%M:%S.%f").timestamp()
        return BaseHandler.format_dates({
            "items": Logger.get_logs(level, category, start_date, end_date)
        })

    def start(self, admin_token:str, _ip):
        """
        POST /admin/start
        """
        self._validate_token(admin_token, _ip)

        if Database.get_meta("start_time", default=None, type=int) is not None:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "Contest has already been started!")

        start_time = int(datetime.datetime.now().timestamp())
        Database.set_meta("start_time", start_time)
        return BaseHandler.format_dates(
            {"start_time": start_time},
            fields=["start_time"]
        )

    def set_extra_time(self, admin_token:str, extra_time:int, _ip, token:str=None):
        """
        POST /admin/set_extra_time
        """
        self._validate_token(admin_token, _ip)

        if token is None:
            Database.set_meta("extra_time", extra_time)
        else:
            Database.set_extra_time(token, extra_time)
        return {}

    def status(self, admin_token:str, _ip):
        """
        POST /admin/status
        """
        self._validate_token(admin_token, _ip)

        start_time = Database.get_meta('start_time', type=int)
        extra_time = Database.get_meta('extra_time', type=int, default=0)
        remaining_time = BaseHandler._get_remaining_time(0)

        return BaseHandler.format_dates({
            "start_time": start_time,
            "extra_time": extra_time,
            "remaining_time": remaining_time,
            "loaded": ContestManager.has_contest
        }, fields=["start_time"])

    def user_list(self, admin_token:str, _ip):
        """
        POST /admin/user_list
        """
        self._validate_token(admin_token, _ip)
        return BaseHandler.format_dates({"items": Database.get_users()}, fields=["first_login"])
