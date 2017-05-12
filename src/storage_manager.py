#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import os
import os.path
from .config import Config


class StorageManager:

    # TODO think about that
    ALLOWED_CHARSET = "[a-zA-Z0-9_-.()\[\]]"
    MAX_LENGTH = 100

    @staticmethod
    def new_source_file(source_id, filename):
        filename = StorageManager._escape(filename)
        relative_path = os.path.join("source", source_id, filename)
        absolute_path = StorageManager.get_absolute_path(relative_path)
        StorageManager.create_dir(absolute_path)
        return relative_path

    @staticmethod
    def new_output_file(output_id, filename):
        filename = StorageManager._escape(filename)
        relative_path = os.path.join("output", output_id, filename)
        absolute_path = StorageManager.get_absolute_path(relative_path)
        StorageManager.create_dir(absolute_path)
        return relative_path

    @staticmethod
    def create_dir(filename):
        dirname = os.path.dirname(filename)
        os.makedirs(dirname)

    @staticmethod
    def get_absolute_path(relative_path):
        return os.path.join(Config.storedir, relative_path)

    @staticmethod
    def _escape(filename):
        # TODO vvvvvvvv
        return filename
