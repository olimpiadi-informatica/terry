#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
from werkzeug.exceptions import BadRequest, Forbidden

from src.config import Config
from src.database import Database
from src.logger import Logger
from .handlers.base_handler import BaseHandler


class Validators:

    @staticmethod
    def validate_during_contest(handler):
        def handle(*args, **kwargs):
            token = Validators._guess_token(**kwargs)
            Validators._ensure_contest_running(token)
            return handler(*args, **kwargs)
        return BaseHandler.initialize_request_params(handle)

    @staticmethod
    def validate_admin_only(handler):
        def handle(*args, **kwargs):
            admin_token = kwargs["admin_token"]
            ip = kwargs["_ip"]
            Validators._validate_admin_token(admin_token, ip)
            del kwargs["admin_token"]
            del kwargs["_ip"]
            return handler(*args, **kwargs)
        BaseHandler.initialize_request_params(handle)
        BaseHandler.add_request_param(handle, "admin_token", str)
        BaseHandler.add_request_param(handle, "_ip", str)
        return handle

    @staticmethod
    def register_user_ip(handler):
        def handle(*args, **kwargs):
            token = Validators._guess_token(**kwargs)
            ip = kwargs["_ip"]
            if token is not None and Database.get_user(token) is not None:
                Database.register_ip(token, ip)
            del kwargs["_ip"]
            return handler(*args, **kwargs)
        BaseHandler.initialize_request_params(handle)
        BaseHandler.add_request_param(handle, "_ip", str)
        return handle

    @staticmethod
    def validate_id(param, name, getter):
        def closure(handler):
            def handle(*args, **kwargs):
                thing = getter(kwargs[param])
                if thing is None:
                    BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "No such " + name)
                del kwargs[param]
                kwargs[name] = thing
                return handler(*args, **kwargs)
            BaseHandler.initialize_request_params(handle)
            BaseHandler.add_request_param(handle, param, str)
            return handle
        return closure

    @staticmethod
    def validate_input_id(handler):
        return Validators.validate_id("input_id", "input", Database.get_input)(handler)

    @staticmethod
    def validate_output_id(handler):
        return Validators.validate_id("output_id", "output", Database.get_output)(handler)

    @staticmethod
    def validate_source_id(handler):
        return Validators.validate_id("source_id", "source", Database.get_source)(handler)

    @staticmethod
    def validate_submission_id(handler):
        return Validators.validate_id("submission_id", "submission", Database.get_submission)(handler)

    @staticmethod
    def validate_token(handler):
        return Validators.validate_id("token", "user", Database.get_user)(handler)

    @staticmethod
    def validate_task(handler):
        return Validators.validate_id("task", "task", Database.get_task)(handler)

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
