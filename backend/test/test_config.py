#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2018 - Luca Versari <veluca93@gmail.com>
import unittest

import yaml.parser

from terry.config import Config
from test.utils import Utils


class TestConfig(unittest.TestCase):
    def setUp(self):
        self.configFilePath = Utils.new_tmp_file()
        Config.loaded = False

    def test_class_method_generation(self):
        self._write_config("test: 42")

        Config.set_config_file(self.configFilePath)
        self.assertEqual(42, Config.test)

    def test_file_not_found(self):
        with self.assertRaises(SystemExit):
            with Utils.nostderr():
                Config.set_config_file('/this/file/doesnt/exist')

    def test_cannot_load_again(self):
        self._write_config("test: foo")

        Config.set_config_file(self.configFilePath)
        with self.assertRaises(RuntimeError):
            Config.set_config_file(self.configFilePath)

    def test_empty_config(self):
        Config.set_config_file(self.configFilePath)

    def test_invalid_yaml(self):
        self._write_config("[42")
        with self.assertRaises(yaml.parser.ParserError):
            Config.set_config_file(self.configFilePath)

    def _write_config(self, config):
        with open(self.configFilePath, 'w') as file:
            file.write(config)

    def tearDown(self):
        # clean the config class
        Config.loaded = False
