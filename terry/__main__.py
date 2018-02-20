#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017-2018 - Luca Versari <veluca93@gmail.com>

import argparse

from terry.config import Config
from terry.contest_manager import ContestManager
from terry.database import Database
from terry.logger import Logger
from terry.server import Server


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-c",
        "--config",
        help="Path to the config file",
        default="config/config.yaml")
    args = parser.parse_args()

    if args.config:
        Config.set_config_file(args.config)

    Logger.set_log_level(Config.log_level)
    Logger.connect_to_database()
    Database.connect_to_database()
    ContestManager.start()
    server = Server()
    server.run()


if __name__ == '__main__':
    main()
