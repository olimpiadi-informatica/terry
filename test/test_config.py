#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
import os
import tempfile
import unittest

import yaml

from src.config import Config
from test.utils import Utils


class TestConfig(unittest.TestCase):
    def setUp(self):
        self.configFile = tempfile.NamedTemporaryFile()
        self.configFilePath = self.configFile.name
        Config.loaded = False

    def test_class_method_generation(self):
        self._write_config("test: 42")

        Config.set_config_file(self.configFilePath)
        self.assertEqual(42, Config.test)

    def test_file_not_found(self):
        with self.assertRaises(FileNotFoundError):
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

    def test_default_file_missing(self):
        wd = os.getcwd()
        os.chdir(tempfile.gettempdir())
        try:
            with Utils.nostderr() as stderr:
                with self.assertRaises(SystemExit) as ex:
                    Config.set_config_file("config/config.yaml")
            self.assertEqual(1, ex.exception.code)
            self.assertTrue(stderr.buffer.find("You need to (at least) copy and paste") >= 0)
        finally:
            os.chdir(wd)

    def _write_config(self, config):
        with open(self.configFilePath, 'w') as file:
            file.write(config)

    def tearDown(self):
        self.configFile.close()
        # clean the config class
        Config.loaded = False
