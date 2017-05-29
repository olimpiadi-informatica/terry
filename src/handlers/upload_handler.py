#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>
from ..validators import Validators
from .info_handler import InfoHandler
from .base_handler import BaseHandler

from ..database import Database
from ..storage_manager import StorageManager
from ..contest_manager import ContestManager


class UploadHandler(BaseHandler):

    @Validators.during_contest
    @Validators.register_user_ip
    @Validators.validate_input_id
    @Validators.validate_file
    def upload_output(self, input, file):
        """
        POST /upload_output
        """
        output_id = Database.gen_id()
        path = StorageManager.new_output_file(output_id, file["name"])

        StorageManager.save_file(path, file["content"])
        file_size = StorageManager.get_file_size(path)

        result = ContestManager.evaluate_output(input["task"], input["path"], path)

        Database.add_output(output_id, input["id"], path, file_size, result)
        return InfoHandler.patch_output(Database.get_output(output_id))

    @Validators.during_contest
    @Validators.register_user_ip
    @Validators.validate_input_id
    @Validators.validate_file
    def upload_source(self, input, file):
        """
        POST /upload_source
        """
        source_id = Database.gen_id()
        path = StorageManager.new_source_file(source_id, file["name"])

        StorageManager.save_file(path, file["content"])
        file_size = StorageManager.get_file_size(path)

        Database.add_source(source_id, input["id"], path, file_size)
        return BaseHandler.format_dates(Database.get_source(source_id))
