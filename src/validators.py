#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
from werkzeug.exceptions import Forbidden

from src.config import Config
from src.database import Database
from src.logger import Logger
from .handlers.base_handler import BaseHandler


class Validators:

    @staticmethod
    def during_contest(handler):
        """
        Ensure the handler is called only when the contest is running. Because the contest could end at different times
        for each user it needs to guess the user token from the parameters. If the guess fails the user extra time is
        ignored
        """
        def handle(*args, **kwargs):
            token = Validators._guess_token(**kwargs)
            Validators._ensure_contest_running(token)
            return handler(*args, **kwargs)
        return BaseHandler.initialize_request_params(handle, handler)

    @staticmethod
    def admin_only(handler):
        """
        Ensure the handler is called from an admin. The `admin_token` param is required
        """
        def handle(*args, **kwargs):
            admin_token = kwargs["admin_token"]
            ip = kwargs["_ip"]
            Validators._validate_admin_token(admin_token, ip)
            del kwargs["admin_token"]
            del kwargs["_ip"]
            return handler(*args, **kwargs)
        BaseHandler.initialize_request_params(handle, handler)
        BaseHandler.add_request_param(handle, "admin_token", str)
        BaseHandler.add_request_param(handle, "_ip", str)
        return handle

    @staticmethod
    def validate_file(handler):
        """
        Ensure a file is present in the request. The file must be provided in a multipart/form and the field must be
        named "file".
        It provides the handler with a "file" argument which is a dict with 2 properties: "name" and "content"
        """
        def handle(*args, **kwargs):
            return handler(*args, **kwargs)
        BaseHandler.initialize_request_params(handle, handler)
        BaseHandler.add_request_param(handle, "file", None, True)
        return handle

    @staticmethod
    def register_user_ip(handler):
        """
        Guess the token from the request and log the ip of the client in the database. If the token cannot be guessed
        nothing is logged.
        """
        def handle(*args, **kwargs):
            token = Validators._guess_token(**kwargs)
            ip = kwargs["_ip"]
            if token is not None and Database.get_user(token) is not None:
                Database.register_ip(token, ip)
            del kwargs["_ip"]
            return handler(*args, **kwargs)
        BaseHandler.initialize_request_params(handle, handler)
        BaseHandler.add_request_param(handle, "_ip", str)
        return handle

    @staticmethod
    def validate_id(param, name, getter):
        """
        Ensure that in the request "param" is present and it's valid. If it is present `getter` is called with the param
        and the return values is sent to the handler as "name". If the getter returns None an error is thrown
        It provides the handler with a `name` argument with the return value of getter.
        """
        def closure(handler):
            def handle(*args, **kwargs):
                thing = getter(kwargs[param])
                if thing is None:
                    BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "No such " + name)
                del kwargs[param]
                kwargs[name] = thing
                return handler(*args, **kwargs)
            BaseHandler.initialize_request_params(handle, handler)
            BaseHandler.add_request_param(handle, param, str)
            # the case when the name of the model corresponds with the param
            if name != param:
                del handle.request_params[name]
            return handle
        return closure

    @staticmethod
    def validate_input_id(handler):
        """
        Expects input_id in the request and provides input to the handler
        """
        return Validators.validate_id("input_id", "input", Database.get_input)(handler)

    @staticmethod
    def validate_output_id(handler):
        """
        Expects output_id in the request and provides output to the handler
        """
        return Validators.validate_id("output_id", "output", Database.get_output)(handler)

    @staticmethod
    def validate_source_id(handler):
        """
        Expects source_id in the request and provides source to the handler
        """
        return Validators.validate_id("source_id", "source", Database.get_source)(handler)

    @staticmethod
    def validate_submission_id(handler):
        """
        Expects submission_id in the request and provides input to the handler
        """
        return Validators.validate_id("submission_id", "submission", Database.get_submission)(handler)

    @staticmethod
    def validate_token(handler):
        """
        Expects token in the request and provides user to the handler
        """
        return Validators.validate_id("token", "user", Database.get_user)(handler)

    @staticmethod
    def validate_task(handler):
        """
        Expects task (the name) in the request and provides task (the task) to the handler
        """
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
