#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

import os
import os.path
import re

from .config import Config


class StorageManager:
    """
    Maximum length of a file name (including the extension)
    """
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
        return os.path.join("source", source_id[:2], source_id[2:4], source_id,
                            filename)

    @staticmethod
    def new_output_file(output_id, filename):
        """
        Get the relative path to the output file with the specified filename
        :param output_id: id of the output file
        :param filename: name of the file, will be sanitized
        :return: A path relative to the Config.storedir where save that file
        """
        filename = StorageManager._sanitize(filename)
        return os.path.join("output", output_id[:2], output_id[2:4], output_id,
                            filename)

    @staticmethod
    def new_input_file(input_id, task_name, attempt):
        """
        Get the relative path to the input file for the specified attempt
        on the specified task
        :param input_id: id of the input file
        :param task_name: name of the task
        :param attempt: attempt on the task
        :return: A path relative to the Config.storedir where that file is
        """
        filename = task_name + "_input_" + str(attempt) + ".txt"
        path_prefix = [input_id[:2], input_id[2:4], input_id, filename]
        filename = os.path.join("input", *path_prefix)
        StorageManager._create_dir(StorageManager.get_absolute_path(filename))
        return filename

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
    def save_file(path, file_content):
        """
        Store a file in the filesystem, creates the directories needed
        :param path: Path of the file
        :param file_content: Content of the file
        """
        absolute_path = StorageManager.get_absolute_path(path)
        StorageManager._create_dir(absolute_path)
        with open(absolute_path, "wb") as f:
            f.write(file_content)

    @staticmethod
    def rename_file(src_path, dst_path):
        """
        Moves a file in the filesystem, creates the directories needed
        :param src_path: Relative path of the file
        :param dst_path: Relative path where to put the file
        """
        src_path = StorageManager.get_absolute_path(src_path)
        dst_path = StorageManager.get_absolute_path(dst_path)
        StorageManager._create_dir(dst_path)
        os.rename(src_path, dst_path)

    @staticmethod
    def get_absolute_path(relative_path):
        """
        Get the absolute path of a stored file
        :param relative_path: Relative path of the file
        :return: The absolute path of the file
        """
        if os.path.isabs(relative_path):
            return relative_path
        return os.path.abspath(os.path.join(Config.storedir, relative_path))

    @staticmethod
    def _create_dir(filename):
        """
        Create a directory in the filesystem
        :param filename: Absolute path of the file or its directory
        """
        dirname = os.path.dirname(filename)
        os.makedirs(dirname, exist_ok=True)

    @staticmethod
    def _sanitize(filename):
        """
        Sanitize a filename, convert all the spaces to underscores and remove
        all invalid characters.
        The result string can only contain chars in [a-zA-Z_-.]. The filename
        is also truncated if it has more than
        MAX_LENGTH chars (it tries to truncate the name and keep the extension)
        :param filename: filename to sanitize
        :return: the sanitized file name
        """
        filename = re.sub(r'(?u)[^-\w.]', '',
                          filename.strip().replace(' ', '_'))
        if filename == "" or filename == "." or filename == "..":
            raise ValueError("Invalid file name")
        name, ext = os.path.splitext(filename)
        # if the extension is too long
        if len(ext) > StorageManager.MAX_LENGTH - 1:
            return filename[0:StorageManager.MAX_LENGTH]
        name_len = min(len(name), StorageManager.MAX_LENGTH - len(ext))
        return name[0:name_len] + ext
