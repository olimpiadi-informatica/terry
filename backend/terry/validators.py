#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2019 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2018 - Luca Versari <veluca93@gmail.com>
# Copyright 2018 - Massimo Cairo <cairomassimo@gmail.com>
# Copyright 2018 - William Di Luigi <williamdiluigi@gmail.com>

import time

import jwt
from werkzeug.exceptions import Forbidden, BadRequest

from terry.config import Config
from terry.contest_manager import ContestManager
from terry.database import Database
from terry.handler_params import HandlerParams
from terry.handlers.base_handler import BaseHandler
from terry.logger import Logger


class Validators:

    @staticmethod
    def during_contest(handler):
        """
        Ensure the handler is called only when the contest is running.
        Because the contest could end at different times for each user it
        needs to guess the user token from the parameters. If the guess fails
        the user extra time is ignored
        """

        def handle(*args, **kwargs):
            token = Validators._guess_token(**kwargs)
            Validators._ensure_contest_running(token)
            return handler(*args, **kwargs)

        return HandlerParams.initialize_handler_params(handle, handler)

    @staticmethod
    def contest_started(handler):
        """
        Ensure the handler is called only when the contest has been started.
        """
        def handle(*args, **kwargs):
            Validators._ensure_contest_started()
            return handler(*args, **kwargs)

        return HandlerParams.initialize_handler_params(handle, handler)

    @staticmethod
    def admin_only(handler):
        """
        Ensure the handler is called from an admin. The `admin_token` param is
        required
        """

        def handle(*args, **kwargs):
            admin_token = kwargs["admin_token"].strip().upper()
            ip = kwargs["_ip"]
            Validators._validate_admin_token(admin_token, ip)
            del kwargs["admin_token"]
            del kwargs["_ip"]
            return handler(*args, **kwargs)

        HandlerParams.initialize_handler_params(handle, handler)
        HandlerParams.add_handler_param(handle, "admin_token", str)
        HandlerParams.add_handler_param(handle, "_ip", str)
        return handle

    @staticmethod
    def validate_file(handler):
        """
        Ensure a file is present in the request. The file must be provided in a
        multipart/form and the field must be named "file". It provides the
        handler with a "file" argument which is a dict with 2 properties:
        "name" and "content"
        """

        def handle(*args, **kwargs):
            return handler(*args, **kwargs)

        HandlerParams.initialize_handler_params(handle, handler)
        HandlerParams.add_handler_param(handle, "file", None, True)
        return handle

    @staticmethod
    def register_user_ip(handler):
        """
        Guess the token from the request and log the ip of the client in the
        database. If the token cannot be guessed nothing is logged.
        """

        def handle(*args, **kwargs):
            token = Validators._guess_token(**kwargs)
            ip = kwargs["_ip"]
            if token is not None and Database.get_user(token) is not None:
                if Database.register_ip(token, ip):
                    Logger.info("LOGIN",
                                "User %s logged in from %s for the first "
                                "time" % (token, ip))
            del kwargs["_ip"]
            return handler(*args, **kwargs)

        HandlerParams.initialize_handler_params(handle, handler)
        HandlerParams.add_handler_param(handle, "_ip", str)
        return handle

    @staticmethod
    def validate_id(param, name, getter, required=True):
        """
        Ensure that in the request "param" is present and it's valid. If it
        is present `getter` is called with the param and the return values is
        sent to the handler as "name". If the getter returns None an error is
        thrown. It provides the handler with a `name` argument with the
        return value of getter.
        """

        def closure(handler):
            def handle(*args, **kwargs):
                if param in kwargs:
                    thing = getter(kwargs[param])
                    if thing is None:
                        BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                              "No such " + name)
                    del kwargs[param]
                else:
                    thing = None
                kwargs[name] = thing
                return handler(*args, **kwargs)

            HandlerParams.initialize_handler_params(handle, handler)
            HandlerParams.add_handler_param(handle, param, str,
                                            required=required)
            # the case when the name of the model corresponds with the param
            if name != param:
                HandlerParams.remove_handler_param(handle, name)
            return handle

        return closure

    @staticmethod
    def validate_input_id(handler):
        """
        Expects input_id in the request and provides input to the handler
        """
        return Validators.validate_id("input_id", "input", Database.get_input)(
            handler)

    @staticmethod
    def validate_output_id(handler):
        """
        Expects output_id in the request and provides output to the handler
        """
        return Validators.validate_id("output_id", "output",
                                      Database.get_output)(handler)

    @staticmethod
    def validate_source_id(handler):
        """
        Expects source_id in the request and provides source to the handler
        """
        return Validators.validate_id("source_id", "source",
                                      Database.get_source)(handler)

    @staticmethod
    def validate_submission_id(handler):
        """
        Expects submission_id in the request and provides input to the handler
        """
        return Validators.validate_id("submission_id", "submission",
                                      Database.get_submission)(handler)

    @staticmethod
    def validate_token(handler):
        """
        Expects token in the request and provides user to the handler
        """

        def handle(*args, **kwargs):
            if "_request" in kwargs:
                request = kwargs["_request"]
                jwt_token = request.cookies.get("token", None)
            else:
                jwt_token = None
            token = kwargs["token"]

            user = Database.get_user(token)
            if not user and not Config.jwt_secret:
                BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "No such user")
            elif not user and Config.jwt_secret and jwt_token:
                kwargs["user"] = Validators._get_user_from_sso(jwt_token, token)
            elif not user and Config.jwt_secret and not jwt_token:
                BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                      "Please login at %s" % Config.sso_url)
            elif not Config.jwt_secret and not user["sso_user"]:
                kwargs["user"] = user
            elif not Config.jwt_secret and user["sso_user"]:
                BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                      "No login method available for this user")
            elif Config.jwt_secret and not user["sso_user"]:
                kwargs["user"] = user
            elif Config.jwt_secret and user["sso_user"]:
                kwargs["user"] = Validators._get_user_from_sso(jwt_token, token)
            else:
                BaseHandler.raise_exc(BadRequest,  # pragma: nocover
                                      "INTERNAL_ERROR", "Login failed")
            # makes sure the window starts
            if Validators._ensure_window_start(token):
                kwargs["user"] = Database.get_user(token)

            del kwargs["token"]
            if "_request" in kwargs:
                del kwargs["_request"]
            return handler(*args, **kwargs)

        HandlerParams.initialize_handler_params(handle, handler)
        HandlerParams.add_handler_param(handle, "_request", None)
        HandlerParams.add_handler_param(handle, "token", str)
        HandlerParams.remove_handler_param(handle, "user")
        return handle

    @staticmethod
    def validate_task(handler):
        """
        Expects task (the name) in the request and provides task (the task)
        to the handler
        """
        return Validators.validate_id("task", "task", Database.get_task)(
            handler)

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
        """
        Makes sure that the contest is running for the user, if any. If the user has a time window it is also checked.
        :param token: The optional token of the user.
        """
        extra_time = None
        start_delay = None
        if token:
            Validators._ensure_window_start(token)
            user = Database.get_user(token)
            if user:
                extra_time = user["extra_time"]
                start_delay = user["contest_start_delay"]
        if Database.get_meta("start_time") is None:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                  "The contest has not started yet")
        contest_end = BaseHandler.get_end_time(extra_time)
        window_end = BaseHandler.get_window_end_time(extra_time, start_delay)
        now = time.time()
        # check the contest is not finished
        if contest_end < now:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                  "The contest has ended")
        # if a window is present check it's not finished
        if window_end and window_end < now:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                  "Your window has ended")

    @staticmethod
    def _ensure_contest_started():
        if Database.get_meta("start_time") is None:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                  "The contest has not started yet")

    @staticmethod
    def _validate_admin_token(token, ip):
        """
        Ensure the admin token is valid
        :param token: Token to check
        :param ip: IP of the client
        """

        correct_token = Database.get_meta("admin_token")

        if correct_token is None:
            ContestManager.extract_contest(token)
            ContestManager.read_from_disk()
            correct_token = token

        if token != correct_token:
            Logger.warning("LOGIN_ADMIN", "Admin login failed from %s" % ip)
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                  "Invalid admin token!")
        else:
            if Database.register_admin_ip(ip):
                Logger.info("LOGIN_ADMIN",
                            "An admin has connected from a new ip: %s" % ip)

    @staticmethod
    def _get_user_from_sso(jwt_token, token):
        try:
            data = jwt.decode(jwt_token, Config.jwt_secret,
                              algorithms=['HS256'])
            username = data["username"]
            name = data.get("firstName", username)
            surname = data.get("lastName", "")
            if username != token:
                BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                      "Use the same username from the SSO")
            if Database.get_user(username) is None:
                Database.begin()
                Database.add_user(username, name, surname, sso_user=True,
                                  autocommit=False)
                for task in Database.get_tasks():
                    Database.add_user_task(username, task["name"],
                                           autocommit=False)
                Database.commit()
                Logger.info("NEW_USER", "User %s created from SSO" % username)
            return Database.get_user(username)
        except jwt.exceptions.DecodeError:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN",
                                  "Please login at %s" % Config.sso_url)

    @staticmethod
    def _ensure_window_start(token):
        """
        Makes sure that the window of the user has been started
        :param token: The token of the user
        :return: True if the user has been updated
        """
        if not Database.get_meta("window_duration", None):
            return False
        user = Database.get_user(token)
        if not user:
            return False
        start_delay = user["contest_start_delay"]
        if start_delay is not None:
            return False
        start = Database.get_meta("start_time", type=int)
        if start is None:
            return False
        now = time.time()
        delay = now - start
        Database.set_start_delay(token, delay)
        Logger.info("WINDOW_START", "Contest started for %s after %d" % (token, delay))
        return True
