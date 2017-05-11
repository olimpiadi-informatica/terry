#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import json

from werkzeug.wrappers import Response


class BaseHandler:

    @staticmethod
    def raise_exc(cls, code, message):
        response = Response()
        response.code = cls.code
        response.mimetype = 'application/json'
        response.data = json.dumps({
            'code': code,
            'message': message
        })
        raise cls(response=response)

    def handle(self, endpoint, route_args, request):
        pass
