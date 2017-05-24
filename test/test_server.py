#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import unittest

from unittest.mock import patch

from src.server import Server
from test.utils import Utils


class TestServer(unittest.TestCase):

    def setUp(self):
        self.server = Server()

    @patch("src.server.Server.wsgi_app", side_effect=Exception())
    def test_call_with_error(self, mock):
        with Utils.nostderr() as stderr:
            res = self.server({"REQUEST_METHOD":"GET"}, lambda *args: 42)
        # this is a garbage way to check the output of the method...
        self.assertEqual(500, res._callbacks[1].__self__._status_code)
        self.assertIn("UNCAUGHT_EXCEPTION", stderr.buffer)
