#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import json

from werkzeug.exceptions import HTTPException
from werkzeug.wrappers import Response


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
            data = self.__getattribute__(endpoint)(route_args, request)
            response = Response()
            response.code = 200
            response.mimetype = "application/json"
            response.data = json.dumps(data)
            return response
        except HTTPException as e:
            return e
