#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
import os
import string
import tempfile
import contextlib
import sys

import datetime

import random

from src.config import Config
from src.database import Database
from src.logger import Logger


class Utils:
    prefix = None

    @staticmethod
    def prepare_test(load_config=True, connect_database=True, connect_logger=True):
        config_file_name = Utils.new_tmp_file()
        log_file_name = Utils.new_tmp_file()
        db_file_name = Utils.new_tmp_file()
        contest_dir = Utils.new_tmp_dir("contest", create=False)

        with open(config_file_name, 'w') as file:
            file.write("logfile: %s\n"
                       "db: %s\n"
                       "storedir: %s\n"
                       "contest_path: %s\n" % (log_file_name, db_file_name,
                                               Utils.new_tmp_dir(), contest_dir))

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
            def __init__(self): self.buffer = ""
            def write(self, data): self.buffer += data
            def flush(self): pass
        sys.stderr = Devnull()
        try:
            yield sys.stderr
        finally:
            sys.stderr = savestderr

    @staticmethod
    def get_tmp_dir():
        if Utils.prefix is None:
            Utils.prefix = os.path.join(tempfile.gettempdir(), "territoriali-backend-tests",
                                        datetime.datetime.now().strftime("temp-%Y-%m-%d_%H-%M-%S"))
            os.makedirs(Utils.prefix, exist_ok=True)
        return Utils.prefix

    @staticmethod
    def new_tmp_dir(prefix="", create=True):
        dir_name = Utils.random_string()
        path = os.path.join(Utils.get_tmp_dir(), prefix, dir_name)
        if create: os.makedirs(path, exist_ok=True)
        return path

    @staticmethod
    def new_tmp_file(prefix="", create=True):
        file_name = Utils.random_string()
        path = os.path.join(Utils.get_tmp_dir(), prefix, file_name)
        if create: open(path, "w").close()
        return path

    @staticmethod
    def random_string(length=8, chars=string.ascii_uppercase+string.ascii_lowercase+string.digits):
        return ''.join(random.choice(chars) for _ in range(length))

    @staticmethod
    def start_contest(since=5, duration=18000):
        Database.set_meta("start_time", int(datetime.datetime.now().timestamp() - since))
        Database.set_meta("contest_duration", duration)
