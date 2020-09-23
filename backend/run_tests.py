#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import sys
import unittest
# these rows are magic, they change the path from where the modules are loaded
# the test suite should use "import terry.stuff"
from os import path

sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))
program = unittest.TestProgram(argv=['discover']+sys.argv[1:], module=None)
program.runTests()
