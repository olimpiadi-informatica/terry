#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

from .info_handler import InfoHandler
from .base_handler import BaseHandler

from ..database import Database
from ..storage_manager import StorageManager
from ..contest_manager import ContestManager
from werkzeug.exceptions import Forbidden


class UploadHandler(BaseHandler):

    def upload_output(self, input, _ip, _file_content, _file_name):
        """
        POST /upload_output
        """
        output_id = Database.gen_id()
        path = StorageManager.new_output_file(output_id, _file_name)

        StorageManager.save_file(path, _file_content)
        file_size = StorageManager.get_file_size(path)

        input = Database.get_input(input)
        if input is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such input")

        token = input["token"]
        Database.register_ip(token, _ip)

        result = ContestManager.evaluate_output(input["task"], input["path"], path)

        Database.add_output(output_id, input["id"], path, file_size, result)
        return InfoHandler.patch_output(Database.get_output(output_id))

    def upload_source(self, input, _ip, _file_content, _file_name):
        """
        POST /upload_source
        """
        source_id = Database.gen_id()

        input = Database.get_input(input)
        if input is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such input")

        token = input["token"]
        Database.register_ip(token, _ip)

        path = StorageManager.new_source_file(source_id, _file_name)
        StorageManager.save_file(path, _file_content)
        file_size = StorageManager.get_file_size(path)

        Database.add_source(source_id, input["id"], path, file_size)
        return BaseHandler.format_dates(Database.get_source(source_id))
