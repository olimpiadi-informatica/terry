#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import unittest
import sys
# these rows are magic, they change the path from where the modules are loaded
# the test suite should use "import src.stuff"
from os import path, mkdir
sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

program = unittest.TestProgram(argv=['discover'], module=None)
program.runTests()
