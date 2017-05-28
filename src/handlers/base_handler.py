#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

import inspect
import json
import traceback
from datetime import datetime
from functools import wraps

from werkzeug.exceptions import HTTPException, BadRequest, Forbidden
from werkzeug.wrappers import Response

from ..config import Config
from ..database import Database
from ..logger import Logger


class BaseHandler:

    @staticmethod
    def raise_exc(cls, code, message):
        """
        Raise an HTTPException with a code and a message sent in a json like
         {
             "code": code
             "message": message
         }
        :param cls: HTTPException of the error, for example NotFound, BadRequest, NotAuthorized
        :param code: A brief message for the exception, like MISSING_PARAMETER
        :param message: A longer description of the error
        :return: Nothing, raise the provided exception with the correct response
        """
        response = Response()
        response.mimetype = "application/json"
        response.status_code = cls.code
        response.data = json.dumps({
            "code": code,
            "message": message
        })
        raise cls(response=response)

    def handle(self, endpoint, route_args, request):
        """
        Handle a request in the derived handler. The request is routed to the correct method using *endpoint*
        :param endpoint: A string with the name of the class method to call with (route_args, request) as parameters,
        this method should return a Response or call self.raise_exc. *NOTE*: the method MUST be implemented in the
        derived class
        :param route_args: The route parameters, the parameters extracted from the matching route in the URL
        :param request: The Request object, request.args contains the query parameters of the request
        :return: Return a Response if the request is successful, an HTTPException if an error occurred
        """
        try:
            data = BaseHandler._call(self.__getattribute__(endpoint), route_args, request)
            response = Response()
            if data is not None:
                response.code = 200
                response.mimetype = "application/json"
                response.data = json.dumps(data)
            else:
                response.code = 204
            return response
        except HTTPException as e:
            return e

    def parse_body(self, request):
        """
        Parse the body part of the request in JSON
        :param request: The request to be parsed
        :return: A dict with the content of the body
        """
        return request.form

    @staticmethod
    def _get_remaining_time(user_extra_time):
        """
        Compute the remaining time for a user
        :param user_extra_time: Extra time specific for the user in seconds
        :return: The number of seconds until the contest is finished
        """
        start = Database.get_meta('start_time', type=int)
        if start is None:
            return None
        contest_duration = Database.get_meta('contest_duration', type=int, default=0)
        contest_extra_time = Database.get_meta('extra_time', type=int, default=0)
        now = int(datetime.now().timestamp())
        if user_extra_time is None:
            user_extra_time = 0

        return start + contest_duration - now + contest_extra_time + user_extra_time

    @staticmethod
    def format_dates(dct, fields=["date"]):
        """
        Given a dict, format all the *fields* fields from int to iso format. The original dict is modified
        :param dct: dict to format
        :param fields: list of the names of the fields to format
        :return: The modified dict
        """
        for k, v in dct.items():
            if isinstance(v, dict):
                dct[k] = BaseHandler.format_dates(v, fields)
            elif k in fields and v is not None:
                dct[k] = datetime.fromtimestamp(v).isoformat()
        return dct

    @staticmethod
    def _call(method, route_args, request):
        """
        This function is MAGIC!
        It takes a method, reads it's parameters and automagically fetch from the request the values. Type-annotation
        is also supported for a simple type validation.
        The values are fetched, in order, from:
        - route_args
        - request.form
        - general_attrs
        - default values
        If a parameter is required but not sent a BadRequest (MISSING_PARAMETERS) error is thrown, if a parameter cannot
        be converted to the annotated type a BadRequest (FORMAT_ERROR) is thrown.
        :param method: Method to be called
        :param route_args: Arguments of the route
        :param request: Request object
        :return: The return value of method
        """
        kwargs = {}
        sign = inspect.signature(method).parameters
        general_attrs = {
            '_request': request,
            '_route_args': route_args,
            '_file_content': BaseHandler._get_file_content(request),
            '_file_name': BaseHandler._get_file_name(request),
            '_ip': BaseHandler.get_ip(request)
        }

        missing_parameters = []

        for attr_name in sign:
            if attr_name in route_args:
                kwargs[attr_name] = route_args[attr_name]
            elif attr_name in request.form:
                kwargs[attr_name] = request.form[attr_name]
            elif attr_name in general_attrs:
                kwargs[attr_name] = general_attrs[attr_name]
            elif sign[attr_name].default is inspect._empty:
                missing_parameters.append(attr_name)

        if len(missing_parameters) > 0:
            BaseHandler.raise_exc(BadRequest, "MISSING_PARAMETERS",
                                  "The missing parameters are: " + ", ".join(missing_parameters))

        for key, value in kwargs.items():
            type = sign[key].annotation
            if type is inspect._empty: continue

            try:
                kwargs[key] = type(value)
            except ValueError:
                BaseHandler.raise_exc(BadRequest, "FORMAT_ERROR",
                                      "The parameter %s cannot be converted to %s" % (key, type.__name__))
        Logger.debug(
            "HTTP",
            "Received request from %s for endpoint %s%s" %
            (
                general_attrs['_ip'],
                method.__name__,
                ", with parameters " + ", ".join(
                        "=".join((kv[0], str(kv[1]))) for kv in kwargs.items()
                            if not kv[0].startswith("_")
                ) if len(kwargs) > 0 else ""
            )
        )
        return method(**kwargs)


    @staticmethod
    def _get_file_name(request):
        """
        Extract the name of the file from the multipart body
        :param request: The Request object
        :return: The filename in the request
        """
        if "file" not in request.files:
            return None
        return request.files["file"].filename

    @staticmethod
    def _get_file_content(request):
        """
        Extract the content of the file from the multipart of the body
        :param request: The Request object
        :return: A *bytes* with the content of the file
        """
        if "file" not in request.files:
            return None
        return request.files["file"].stream.getvalue()

    @staticmethod
    def get_ip(request):
        """
        Return the real IP of the client
        :param request: The Request object
        :return: A string with the IP of the client
        """
        num_proxies = Config.num_proxies
        if num_proxies == 0 or len(request.access_route) < num_proxies:
            return request.remote_addr
        return request.access_route[-num_proxies]

    @staticmethod
    def during_contest(handler):
        @wraps(handler)
        def handle(*args, **kwargs):
            token = BaseHandler.guess_token(**kwargs)
            BaseHandler.ensure_contest_running(token)
            return handler(*args, **kwargs)

        return handle

    @staticmethod
    def guess_token(**kwargs):
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
        else:
            print("I cannot guess the token from these kwargs", kwargs)
            traceback.print_stack()
        return None

    @staticmethod
    def ensure_contest_running(token=None):
        extra_time = None
        if token:
            user = Database.get_user(token)
            if user:
                extra_time = user["extra_time"]
        if Database.get_meta("start_time") is None:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "The contest has not started yet")
        if BaseHandler._get_remaining_time(extra_time) < 0:
            BaseHandler.raise_exc(Forbidden, "FORBIDDEN", "The contest has ended")
