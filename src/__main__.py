#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

from .server import Server
from .config import Config
from .logger import Logger
from .database import Database
from .contest_manager import ContestManager

import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-c", "--config", help="Path to the config file", default="config/config.yaml")
    args = parser.parse_args()

    Config.set_config_file(args.config)

    Logger.connect_to_database()
    Database.connect_to_database()
    ContestManager.read_from_disk()
    ContestManager.start()
    server = Server()
    server.run()

if __name__ == '__main__':
    main()
