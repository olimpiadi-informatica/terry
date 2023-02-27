#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2019 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017-2018 - Luca Versari <veluca93@gmail.com>
# Copyright 2018 - Massimo Cairo <cairomassimo@gmail.com>

import sys
import traceback

import gevent.pywsgi
from gevent import monkey
from werkzeug.exceptions import HTTPException, InternalServerError, NotFound
from werkzeug.routing import Map, Rule
from werkzeug.wrappers import Request
from werkzeug.wsgi import responder

from terry.config import Config
from terry.handlers.admin_handler import AdminHandler
from terry.handlers.base_handler import BaseHandler
from terry.handlers.contest_handler import ContestHandler
from terry.handlers.info_handler import InfoHandler
from terry.handlers.upload_handler import UploadHandler
from terry.logger import Logger

monkey.patch_all()


class Server:
    """ Main server """

    def __init__(self):
        self.handlers = {
            "contest": ContestHandler(),
            "info": InfoHandler(),
            "upload": UploadHandler(),
            "admin": AdminHandler(),
        }

        # The router tries to match the rules, the endpoint MUST be a string
        # with this format
        #     CONTROLLER#ACTION
        # Where CONTROLLER is an handler registered in self.handlers and
        # ACTION is a valid
        # method of that handler
        self.router = Map(
            [
                Rule("/contest", methods=["GET"], endpoint="info#get_contest"),
                Rule("/input/<input_id>", methods=["GET"], endpoint="info#get_input"),
                Rule(
                    "/output/<output_id>", methods=["GET"], endpoint="info#get_output"
                ),
                Rule(
                    "/source/<source_id>", methods=["GET"], endpoint="info#get_source"
                ),
                Rule(
                    "/submission/<submission_id>",
                    methods=["GET"],
                    endpoint="info#get_submission",
                ),
                Rule("/user/<token>/scores",
                     methods=["GET"], endpoint="info#get_user_scores"),
                Rule("/user/<token>", methods=["GET"], endpoint="info#get_user"),
                Rule(
                    "/user/<token>/submissions/<task>",
                    methods=["GET"],
                    endpoint="info#get_submissions",
                ),
                Rule(
                    "/generate_input",
                    methods=["POST"],
                    endpoint="contest#generate_input",
                ),
                Rule("/submit", methods=["POST"], endpoint="contest#submit"),
                Rule("/abandon_input", methods=["POST"], endpoint="contest#abandon_input"),
                Rule(
                    "/internet_detected",
                    methods=["POST"],
                    endpoint="contest#internet_detected",
                ),
                Rule(
                    "/upload_source", methods=["POST"], endpoint="upload#upload_source"
                ),
                Rule(
                    "/upload_output", methods=["POST"], endpoint="upload#upload_output"
                ),
                Rule(
                    "/admin/upload_pack", methods=["POST"], endpoint="admin#upload_pack"
                ),
                Rule(
                    "/admin/download_results",
                    methods=["POST"],
                    endpoint="admin#download_results",
                ),
                Rule("/admin/login", methods=["POST"], endpoint="admin#login"),
                Rule("/admin/log", methods=["POST"], endpoint="admin#log"),
                Rule(
                    "/admin/append_log", methods=["POST"], endpoint="admin#append_log"
                ),
                Rule("/admin/start", methods=["POST"], endpoint="admin#start"),
                Rule(
                    "/admin/set_extra_time",
                    methods=["POST"],
                    endpoint="admin#set_extra_time",
                ),
                Rule("/admin/status", methods=["POST"], endpoint="admin#status"),
                Rule(
                    "/admin/pack_status", methods=["GET"], endpoint="admin#pack_status"
                ),
                Rule("/admin/user_list", methods=["POST"], endpoint="admin#user_list"),
                Rule(
                    "/admin/drop_contest",
                    methods=["POST"],
                    endpoint="admin#drop_contest",
                ),
            ]
        )

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
            Logger.warning(
                "HTTP_ERROR",
                "%s %s %s 404"
                % (BaseHandler.get_ip(request), request.method, request.url),
            )
            return NotFound()

        controller, action = endpoint.split("#")

        return self.handlers[controller].handle(action, args, request)

    def run(self):
        """
        Start a greenlet with the main HTTP server loop
        """
        server = gevent.pywsgi.WSGIServer((Config.address, Config.port), self, log=None)
        try:
            server.init_socket()
        except OSError:
            Logger.error(
                "PORT_ALREADY_IN_USE",
                "Address: '%s' Port: %d" % (Config.address, Config.port),
            )
            sys.exit(1)
        greenlet = gevent.spawn(server.serve_forever)
        port = "" if Config.port == 80 else ":" + str(Config.port)
        Logger.info(
            "SERVER_STATUS",
            "Server started at http://%s%s/" % (str(Config.address), port),
        )
        greenlet.join()
