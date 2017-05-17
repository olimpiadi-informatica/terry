#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
import tempfile
import contextlib
import sys

from src.config import Config
from src.database import Database
from src.logger import Logger

class Utils:
    @staticmethod
    def prepare_test(load_config=True, connect_database=True, connect_logger=True):
        config_file = tempfile.NamedTemporaryFile()
        config_file_name = config_file.name
        log_file = tempfile.NamedTemporaryFile()
        log_file_name = log_file.name
        db_file = tempfile.NamedTemporaryFile()
        db_file_name = db_file.name

        with open(config_file_name, 'w') as file:
            file.write("logfile: %s\n"
                       "db: %s\n" % (log_file_name, db_file_name))

        if load_config:
            Config.loaded = False
            Config.set_config_file(config_file_name)
        if connect_logger:
            Logger.connected = False
            Logger.connect_to_database()
            Logger.set_log_level("WARNING")
        if connect_database:
            Database.connected = False
            Database.connect_to_database()

    @staticmethod
    @contextlib.contextmanager
    def nostderr():
        """
        Suppress stderr output in the with context
        http://stackoverflow.com/a/1810086
        """
        savestderr = sys.stderr
        class Devnull(object):
            def write(self, _): pass
            def flush(self): pass
        sys.stderr = Devnull()
        try:
            yield
        finally:
            sys.stderr = savestderr
