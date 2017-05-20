#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

import sys
import traceback

import gevent.wsgi

from gevent import monkey
from werkzeug.exceptions import (HTTPException, InternalServerError, NotFound)
from werkzeug.routing import Map, Rule, RequestRedirect
from werkzeug.wrappers import Request
from werkzeug.wsgi import responder

from src.handlers.base_handler import BaseHandler
from .config import Config
from .logger import Logger

from .handlers.contest_handler import ContestHandler
from .handlers.info_handler import InfoHandler
from .handlers.upload_handler import UploadHandler
from .handlers.admin_handler import AdminHandler

monkey.patch_all()


class Server:
    """ Main server """
    def __init__(self):
        self.handlers = {
            "contest": ContestHandler(),
            "info": InfoHandler(),
            "upload": UploadHandler(),
            "admin": AdminHandler()
        }

        # The router tries to match the rules, the endpoint MUST be a string with this format
        #     CONTROLLER#ACTION
        # Where CONTROLLER is an handler registered in self.handlers and ACTION is a valid
        # method of that handler
        self.router = Map([
            Rule("/contest", methods=["GET"], endpoint="info#get_contest"),
            Rule("/input/<id>", methods=["GET"], endpoint="info#get_input"),
            Rule("/output/<id>", methods=["GET"], endpoint="info#get_output"),
            Rule("/source/<id>", methods=["GET"], endpoint="info#get_source"),
            Rule("/submission/<id>", methods=["GET"], endpoint="info#get_submission"),
            Rule("/user/<token>", methods=["GET"], endpoint="info#get_user"),
            Rule("/user/<token>/submissions/<task>", methods=["GET"], endpoint="info#get_submissions"),
            Rule("/generate_input", methods=["POST"], endpoint="contest#generate_input"),
            Rule("/submit", methods=["POST"], endpoint="contest#submit"),
            Rule("/upload_source", methods=["POST"], endpoint="upload#upload_source"),
            Rule("/upload_output", methods=["POST"], endpoint="upload#upload_output"),

            Rule("/admin/extract", methods=["POST"], endpoint="admin#extract"),
            Rule("/admin/log", methods=["POST"], endpoint="admin#log"),
            Rule("/admin/start", methods=["POST"], endpoint="admin#start"),
            Rule("/admin/set_extra_time", methods=["POST"], endpoint="admin#set_extra_time"),
            Rule("/admin/status", methods=["POST"], endpoint="admin#status"),
            Rule("/admin/user_list", methods=["POST"], endpoint="admin#user_list")
        ])

    @responder
    def __call__(self, environ, start_response):
        try:
            return self.wsgi_app(environ, start_response)
        except:
            Logger.error("UNCAUGHT_EXCEPTION", traceback.format_exc())
            return InternalServerError()

    def wsgi_app(self, environ, start_response):
        route = self.router.bind_to_environ(environ)
        request = Request(environ)

        try:
            endpoint, args = route.match()
        except HTTPException:
            Logger.warning("HTTP_ERROR", "%s %s %s 404" % (BaseHandler.get_ip(request), request.method, request.url))
            return NotFound()

        controller, action = endpoint.split("#")

        res = self.handlers[controller].handle(action, args, request)
        return res

    def run(self):
        """
        Start a greenlet with the main HTTP server loop
        """
        server = gevent.wsgi.WSGIServer((Config.address, Config.port), self, log=None)
        try:
            server.init_socket()
        except OSError:
            Logger.error("PORT_ALREADY_IN_USE", "Address: '%s' Port: %d" % (Config.address, Config.port))
            sys.exit(1)
        greenlet = gevent.spawn(server.serve_forever)
        Logger.info("SERVER_STATUS", "Server started")
        greenlet.join()
