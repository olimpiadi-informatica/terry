#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

import yaml


class Config:
    """ Main config file """

    loaded = False
    default_values = {
        "logfile": "log.sqlite3",
        "db": "db.sqlite3",
        "address": "",
        "port": 1234,
        "storedir": "./files/",
        "statementdir": "./statements/secret/",
        "queue_size": 64,
        "admin_token": "secret",
        "num_proxies": 0,
        "contest_path": "./contest/",
        "contest_zips": "./zips/"
    }

    @staticmethod
    def set_config_file(config_file):
        """
        Set the config file globally. This method MUST be called once and only once
        :param config_file: The path to the log file
        """
        if Config.loaded is True:
            raise RuntimeError("The config file can be loaded only once")
        Config.loaded = True
        try:
            with open(config_file, 'r') as f:
                cfg = yaml.load(f)
        except FileNotFoundError:
            raise
        for key, value in cfg.items():
            setattr(Config, key, value)
        for key, value in Config.default_values.items():
            if key not in cfg:
                setattr(Config, key, value)
