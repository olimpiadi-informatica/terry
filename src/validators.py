#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
import traceback
from functools import wraps

from werkzeug.exceptions import BadRequest, Forbidden

from src.config import Config
from src.database import Database
from src.logger import Logger
from .handlers.base_handler import BaseHandler


class Validators:
    @staticmethod
    def during_contest(handler):
        @wraps(handler)
        def handle(*args, **kwargs):
            token = Validators._guess_token(**kwargs)
            Validators._ensure_contest_running(token)
            return handler(*args, **kwargs)

        return handle

    @staticmethod
    def admin_only(handler):
        @wraps(handler)
        def handle(*args, **kwargs):
            if "admin_token" not in kwargs:
                BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "You need to provide admin_token")
            admin_token = kwargs["admin_token"]
            ip = kwargs["_ip"]
            Validators._validate_admin_token(admin_token, ip)
            return handler(*args, **kwargs)
        return handle

    @staticmethod
    def valid_input_id(handler):
        @wraps(handler)
        def handle(*args, **kwargs):
            Validators._validate_id("input_id", "input", Database.get_input, kwargs)
            return handler(*args, **kwargs)
        return handle

    @staticmethod
    def valid_output_id(handler):
        @wraps(handler)
        def handle(*args, **kwargs):
            Validators._validate_id("output_id", "output", Database.get_output, kwargs)
            return handler(*args, **kwargs)
        return handle

    @staticmethod
    def valid_source_id(handler):
        @wraps(handler)
        def handle(*args, **kwargs):
            Validators._validate_id("source_id", "source", Database.get_source, kwargs)
            return handler(*args, **kwargs)
        return handle

    @staticmethod
    def valid_submission_id(handler):
        @wraps(handler)
        def handle(*args, **kwargs):
            Validators._validate_id("submission_id", "submission", Database.get_submission, kwargs)
            return handler(*args, **kwargs)
        return handle

    @staticmethod
    def valid_token(handler):
        @wraps(handler)
        def handle(*args, **kwargs):
            Validators._validate_id("token", "user", Database.get_user, kwargs)
            return handler(*args, **kwargs)
        return handle

    @staticmethod
    def valid_task(handler):
        @wraps(handler)
        def handle(*args, **kwargs):
            Validators._validate_id("task", "task", Database.get_task, kwargs)
            return handler(*args, **kwargs)
        return handle

    @staticmethod
    def register_ip(handler):
        @wraps(handler)
        def handle(*args, **kwargs):
            token = Validators._guess_token(**kwargs)
            if "_ip" not in kwargs:
                BaseHandler.raise_exc(BadRequest, "INVALID_CONNECTION", "Your ip cannot be detected")
            ip = kwargs["_ip"]
            if token is not None and Database.get_user(token) is not None:
                Database.register_ip(token,  ip)
            return handler(*args, **kwargs)
        return handle

    @staticmethod
    def _guess_token(**kwargs):
        if "token" in kwargs:
            return kwargs["token"]
        elif "input_id" in kwargs:
            input = Database.get_input(kwargs["input_id"])
            if input: return input["token"]
        elif "output_id" in kwargs:
            output = Database.get_output(kwargs["output_id"])
            if output:
                input = Database.get_input(output["input"])
                if input: return input["token"]
        elif "source_id" in kwargs:
            source = Database.get_source(kwargs["source_id"])
            if source:
                input = Database.get_input(source["input"])
                if input: return input["token"]
        elif "submission_id" in kwargs:
            submission = Database.get_submission(kwargs["submission_id"])
            if submission: return submission["token"]
        return None

    @staticmethod
    def _ensure_contest_running(token=None):
        extra_time = None
        if token:
            user = Database.get_user(token)
            if user:
                extra_time = user["extra_time"]
        if Database.get_meta("start_time") is None:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "The contest has not started yet")
        if BaseHandler.get_remaining_time(extra_time) < 0:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "The contest has ended")

    @staticmethod
    def _validate_admin_token(token, ip):
        """
        Ensure the admin token is valid
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

    @staticmethod
    def _validate_id(param, name, getter, kwargs):
        if param not in kwargs:
            BaseHandler.raise_exc(BadRequest, "MISSING_PARAMETER", "You need to provide " + param)
        thing = getter(kwargs[param])
        if thing is None:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "No such " + name)
        kwargs[name] = thing
