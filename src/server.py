#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import traceback

import gevent
import gevent.wsgi

from gevent import monkey
from werkzeug.exceptions import (BadRequest, HTTPException,
                                 InternalServerError, NotFound)
from werkzeug.routing import Map, Rule, RequestRedirect
from werkzeug.wrappers import Request, Response
from werkzeug.wsgi import responder

monkey.patch_all()


class Server:
    """ Main server """
    def __init__(self):
        self.router = Map([])

    @responder
    def __call__(self, environ, start_response):
        try:
            return self.wsgi_app(environ, start_response)
        except:
            traceback.print_exc()
            return InternalServerError()

    def wsgi_app(self, environ, start_response):
        route = self.router.bind_to_environ(environ)
        try:
            endpoint, args = route.match()
        except RequestRedirect as e:
            return e
        except HTTPException:
            return NotFound()

        # TODO process the request


if __name__ == '__main__':
    server = gevent.wsgi.WSGIServer(('', 1234), Server())
    gevent.spawn(server.serve_forever).join()
