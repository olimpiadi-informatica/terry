#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
import json
import unittest

from unittest.mock import patch

from werkzeug.exceptions import NotFound
from werkzeug.test import EnvironBuilder

from src.logger import Logger
from src.server import Server
from test.utils import Utils


class TestServer(unittest.TestCase):

    def setUp(self):
        Utils.prepare_test()
        self.server = Server()

    @patch("src.server.Server.wsgi_app", side_effect=Exception())
    def test_call_with_error(self, mock):
        with Utils.nostderr() as stderr:
            res = self.server({"REQUEST_METHOD":"GET"}, lambda *args: 42)
        # this is a garbage way to check the output of the method...
        self.assertEqual(500, res._callbacks[1].__self__._status_code)
        self.assertIn("UNCAUGHT_EXCEPTION", stderr.buffer)

    def test_wsgi_app(self):
        res = self.server.wsgi_app(EnvironBuilder('/contest').get_environ(), None)
        data = json.loads(res.data.decode())

        self.assertFalse(data["has_started"])

    def test_wsgi_app_404(self):
        Logger.set_log_level("ERROR")
        res = self.server.wsgi_app(EnvironBuilder('/not_found').get_environ(), None)
        self.assertIsInstance(res, NotFound)

    @patch("gevent.wsgi.WSGIServer.init_socket", side_effect=OSError())
    def test_run_port_in_use(self, mock):
        with self.assertRaises(SystemExit) as ex:
            with Utils.nostderr() as stderr:
                self.server.run()
        self.assertEqual(1, ex.exception.code)
        self.assertIn("PORT_ALREADY_IN_USE", stderr.buffer)

    @patch("gevent.wsgi.WSGIServer.init_socket")
    @patch("gevent.spawn")
    def test_run(self, spawn, init):
        Logger.set_log_level("INFO")
        with patch.object(spawn(), "join") as join:
            with Utils.nostderr() as stderr:
                self.server.run()
        init.assert_called_once_with()
        self.assertTrue(spawn.called)
        join.assert_called_once_with()
        self.assertIn("SERVER_STATUS", stderr.buffer)
        self.assertIn("Server started", stderr.buffer)
