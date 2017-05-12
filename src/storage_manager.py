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
        """
        Get the relative path to the source file with the specified filename
        :param source_id: id of the source file
        :param filename: name of the file, will be sanitized
        :return: A path relative to the Config.storedir where save that file
        """
        filename = StorageManager._sanitize(filename)
        return os.path.join("source", source_id, filename)

    @staticmethod
    def new_output_file(output_id, filename):
        """
        Get the relative path to the output file with the specified filename
        :param output_id: id of the output file
        :param filename: name of the file, will be sanitized
        :return: A path relative to the Config.storedir where save that file
        """
        filename = StorageManager._sanitize(filename)
        return os.path.join("output", output_id, filename)

    @staticmethod
    def get_file_size(filename):
        """
        Get the size of the filename in bytes
        :param filename: Relative path of the file to check
        :return: The number of bytes of the file
        """
        absolute_path = StorageManager.get_absolute_path(filename)
        return os.stat(absolute_path).st_size

    @staticmethod
    def save_file(relative_path, file_content):
        """
        Store a file in the filesystem, creates the directories needed
        :param relative_path: Relative path of the file
        :param file_content: Content of the file
        """
        absolute_path = StorageManager.get_absolute_path(relative_path)
        StorageManager._create_dir(absolute_path)
        file = open(absolute_path, "wb")
        file.write(file_content)
        file.close()

    @staticmethod
    def get_absolute_path(relative_path):
        """
        Get the absolute path of a stored file
        :param relative_path: Relative path of the file 
        :return: The absolute path of the file 
        """
        return os.path.join(Config.storedir, relative_path)

    @staticmethod
    def _create_dir(filename):
        """
        Create a directory in the filesystem
        :param filename: Absolute path of the file or its directory
        """
        dirname = os.path.dirname(filename)
        os.makedirs(dirname)

    @staticmethod
    def _sanitize(filename):
        # TODO vvvvvvvv
        return filename
