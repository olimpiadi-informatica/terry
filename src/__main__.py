#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

from .server import Server
from .config import Config
from .logger import Logger

def main():
    Config.set_config_file("config/config.yaml")
    Logger.connect_to_database()
    server = Server()
    server.run()

if __name__ == '__main__':
    main()
