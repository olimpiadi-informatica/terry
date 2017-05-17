#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import platform
import unittest

from src.contest_manager import ContestManager


class TestContestManager(unittest.TestCase):

    def test_system_extension(self):
        sys_ext = ContestManager.system_extension()
        system = platform.system().lower()
        machine = platform.machine()

        self.assertEqual('.', sys_ext[0])
        self.assertTrue(sys_ext.find(system) >= 0)
        self.assertTrue(sys_ext.find(machine) >= 0)
