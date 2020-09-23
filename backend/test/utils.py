#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2018 - William Di Luigi <williamdiluigi@gmail.com>
import contextlib
import datetime
import os
import random
import shutil
import string
import sys
import tempfile

from terry import crypto
from terry.config import Config
from terry.database import Database
from terry.logger import Logger


class Utils:
    prefix = None
    ZIP_PASSWORD = "ed7ab1008ae6ca"
    ZIP_TOKEN = "EDOOOO-HGKU-2VPK-LBXL-B6NA"

    @staticmethod
    def prepare_test(load_config=True, connect_database=True,
                     connect_logger=True):
        config_file_name = Utils.new_tmp_file()
        log_file_name = Utils.new_tmp_file()
        db_file_name = Utils.new_tmp_file()
        contest_dir = Utils.new_tmp_dir("contest", create=False)

        with open(config_file_name, 'w') as file:
            file.write("logfile: %s\n"
                       "db: %s\n"
                       "storedir: %s\n"
                       "contest_path: %s\n" % (log_file_name, db_file_name,
                                               Utils.new_tmp_dir(),
                                               contest_dir))

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
            Utils.prefix = os.path.join(tempfile.gettempdir(),
                                        "terry-backend-tests",
                                        datetime.datetime.now().strftime(
                                            "temp-%Y-%m-%d_%H-%M-%S"))
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
    def random_string(length=8,
                      chars=string.ascii_uppercase + string.ascii_lowercase +
                            string.digits):
        return ''.join(random.choice(chars) for _ in range(length))

    @staticmethod
    def start_contest(since=5, duration=100):
        Database.set_meta("start_time",
                          int(datetime.datetime.now().timestamp()) - since)
        Database.set_meta("contest_duration", duration)

    @staticmethod
    def setup_encrypted_file(tempdir=None):
        if not tempdir:
            tempdir = Utils.new_tmp_dir()
        enc_path = os.path.join(tempdir, "pack.zip.enc")
        dec_path = os.path.join(tempdir, "pack.zip")
        shutil.copy(os.path.join(os.path.dirname(__file__),
                                 "./assets/pack.zip.enc"), enc_path)
        Config.encrypted_file = enc_path
        Config.decrypted_file = dec_path

    @staticmethod
    def build_pack(metadata):
        asset = os.path.join(os.path.dirname(__file__), "./assets/pack.zip.enc")
        with open(asset, "rb") as f:
            zip = crypto.decode(bytes.fromhex(Utils.ZIP_PASSWORD), f.read())
        password = bytes.fromhex(Utils.ZIP_PASSWORD)
        return crypto.encode(password, zip, metadata.encode())
