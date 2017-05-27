#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
import os
import unittest

from src.config import Config
from src.storage_manager import StorageManager
from test.utils import Utils


class TestStorageManager(unittest.TestCase):

    def test_new_source_file(self):
        source_id = 'source_id'
        filename = 'filename.foo'
        path = StorageManager.new_source_file(source_id, filename)
        self.assertIn("source", path)
        self.assertTrue(path.find(source_id) >= 0)
        self.assertTrue(path.find(filename) >= 0)

    def test_new_output_file(self):
        output_id = 'output_id'
        filename = 'filename.foo'
        path = StorageManager.new_output_file(output_id, filename)
        self.assertIn("output", path)
        self.assertTrue(path.find(output_id) >= 0)
        self.assertTrue(path.find(filename) >= 0)

    def test_new_input_file(self):
        input_id = 'input_id'
        task = 'simple_task'
        attempt = 42
        path = StorageManager.new_input_file(input_id, task, attempt)
        self.assertIn("input", path)
        self.assertTrue(path.find(input_id) >= 0)
        self.assertTrue(path.find(task) >= 0)
        self.assertTrue(path.find(str(attempt)) >= 0)

    def test_get_file_size(self):
        filename = Utils.new_tmp_file()

        with open(filename, 'w') as file:
            file.write('This string is 28 chars long')

        self.assertEqual(28, StorageManager.get_file_size(filename))

    def test_save_file(self):
        backup = Config.storedir
        Config.storedir = Utils.new_tmp_dir("new_path")

        relative_path = os.path.join("baz", "file.txt")
        content = 'This is the content of the file'

        try:
            os.remove(Config.storedir)
        except:
            pass

        StorageManager.save_file(relative_path, content.encode())
        with open(StorageManager.get_absolute_path(relative_path), 'r') as file:
            file_content = file.readlines()
            self.assertEqual(1, len(file_content))
            self.assertEqual(content, file_content[0])

        Config.storedir = backup

    def test_rename_file(self):
        backup = Config.storedir
        Config.storedir = Utils.new_tmp_dir()

        relative_path = 'baz/file.txt'
        new_path = 'baz/txt.elif'
        StorageManager.save_file(relative_path, 'foobar'.encode())
        StorageManager.rename_file(relative_path, new_path)

        with open(StorageManager.get_absolute_path(new_path), 'r') as file:
            lines = file.readlines()
            self.assertEqual('foobar', lines[0])

        Config.storedir = backup

    def test_get_absolute_path(self):
        backup = Config.storedir
        Config.storedir = Utils.new_tmp_dir()

        relative_path = 'path/to/file'
        abs_path = StorageManager.get_absolute_path(relative_path)

        self.assertTrue(abs_path.find(Config.storedir) >= 0)
        self.assertTrue(abs_path.find(relative_path) >= 0)

        Config.storedir = backup

    def test_sanitize(self):
        filename = " fi!@le n²amжe'.txt  "
        sanitized = StorageManager._sanitize(filename)
        self.assertEqual("file_n²amжe.txt", sanitized)

    def test_sanitize_file_too_long(self):
        filename = "file_" + ("a" * 5 * StorageManager.MAX_LENGTH) + ".txt"
        sanitized = StorageManager._sanitize(filename)
        self.assertEqual("file_" + ("a" * (StorageManager.MAX_LENGTH-9)) + ".txt", sanitized)
        self.assertEqual(StorageManager.MAX_LENGTH, len(sanitized))

    def test_sanitize_extension_too_long(self):
        filename = "file." + ("x" * 5 * StorageManager.MAX_LENGTH)
        sanitized = StorageManager._sanitize(filename)
        self.assertEqual("file." + ("x" * (StorageManager.MAX_LENGTH - 5)), sanitized)
        self.assertEqual(StorageManager.MAX_LENGTH, len(sanitized))

    def test_sanitize_no_extension(self):
        filename = "x" * StorageManager.MAX_LENGTH * 5
        sanitized = StorageManager._sanitize(filename)
        self.assertEqual("x" * StorageManager.MAX_LENGTH, sanitized)
        self.assertEqual(StorageManager.MAX_LENGTH, len(sanitized))

    def test_sanitize_no_name(self):
        filename = ".hidden"
        sanitized = StorageManager._sanitize(filename)
        self.assertEqual(".hidden", sanitized)
