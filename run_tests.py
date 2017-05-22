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

# I'm tired to have the /tmp directory full of useless files. This patches the tempfile lib is a very brutal way
# trying to use a subdirectory of /tmp (verytmp)
import tempfile
tmpDirs = tempfile._candidate_tempdir_list()
for dir in tmpDirs:
    if path.isdir(dir):
        newPath = path.join(dir, 'verytmp')
        if not path.isdir(newPath):
            mkdir(newPath)
        tempfile._candidate_tempdir_list = lambda : [newPath]
        break

program = unittest.TestProgram(argv=['discover'], module=None)
program.runTests()
