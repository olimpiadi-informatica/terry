#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import sys
import traceback

import gevent.wsgi

from gevent import monkey
from werkzeug.exceptions import (HTTPException, InternalServerError, NotFound)
from werkzeug.routing import Map, Rule, RequestRedirect
from werkzeug.wrappers import Request
from werkzeug.wsgi import responder

from .config import Config
from .logger import Logger

from .handlers.ping_handler import PingHandler

monkey.patch_all()


class Server:
    """ Main server """
    def __init__(self):
        self.handlers = {
            "ping": PingHandler()
        }

        # The router tries to match the rules, the endpoint MUST be a string with this format
        #     CONTROLLER#ACTION
        # Where CONTROLLER is an handler registered in self.handlers and ACTION is a valid
        # method of that handler
        self.router = Map([
            Rule("/ping", methods=["GET"], endpoint="ping#ping")
        ])

    @responder
    def __call__(self, environ, start_response):
        try:
            return self.wsgi_app(environ, start_response)
        except:
            Logger.warning("ERROR_500", traceback.format_exc())
            return InternalServerError()

    def wsgi_app(self, environ, start_response):
        route = self.router.bind_to_environ(environ)
        request = Request(environ)

        try:
            endpoint, args = route.match()
        except RequestRedirect as e:
            return e
        except HTTPException:
            # TODO find a way to get the real ip address
            Logger.warning("ERROR_404", "%s %s %s" % (request.remote_addr, request.method, request.url))
            return NotFound()

        controller, action = endpoint.split("#")

        res = self.handlers[controller].handle(action, args, request)
        return res

    def run(self):
        """
        Start a greenlet with the main HTTP server loop
        """
        server = gevent.wsgi.WSGIServer((Config.address, Config.port), self)
        try:
            server.init_socket()
        except OSError:
            Logger.warning("PORT_ALREADY_IN_USE", "Address: '%s' Port: %d" % (Config.address, Config.port))
            sys.exit(1)
        greenlet = gevent.spawn(server.serve_forever)
        Logger.info("SERVER_STARTED", "Server started")
        greenlet.join()
