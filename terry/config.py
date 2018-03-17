#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017-2018 - Luca Versari <veluca93@gmail.com>
import sys

import yaml


class Config:
    """ Main config file """

    loaded = False
    logfile = "log.sqlite3"
    db = "db.sqlite3"
    address = ""
    port = 1234
    storedir = "./files/"
    statementdir = "./files/statements/secret/"
    web_statementdir = "/statements/secret/"
    queue_size = 64
    num_proxies = 0
    contest_path = "./contest/"
    encrypted_file = "./zips/pack.zip.enc"
    decrypted_file = "./zips/pack.zip"
    log_level = "INFO"
    jwt_secret = None
    sso_url = ""
    append_log_secret = "secret"

    @staticmethod
    def set_config_file(config_file):
        """
        Set the config file globally. This method should be called at most once
        :param config_file: The path to the log file
        """
        if Config.loaded is True:
            raise RuntimeError("The config file can be loaded only once")
        Config.loaded = True

        try:
            with open(config_file, 'r') as f:
                cfg = yaml.load(f)
        except FileNotFoundError:
            print("Config file %s not found, you should create it!" % config_file, file=sys.stderr)
            print("If you just want to use default values, launch with: -c /dev/null", file=sys.stderr)
            sys.exit(1)

        # if the config file is empty
        if cfg is None:
            cfg = {}

        for key, value in cfg.items():
            setattr(Config, key, value)
