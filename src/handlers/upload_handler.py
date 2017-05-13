#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

from .base_handler import BaseHandler

from ..database import Database
from ..storage_manager import StorageManager
from ..contest_manager import ContestManager
from werkzeug.exceptions import Forbidden


class UploadHandler(BaseHandler):

    def upload_output(self, route_args, request):
        """
        POST /upload_output
        """
        file_content = UploadHandler._get_file_content(request)
        file_name = UploadHandler._get_file_name(request)
        output_id = Database.gen_id()
        input_id = request.form["input"]
        path = StorageManager.new_output_file(output_id, file_name)

        StorageManager.save_file(path, file_content)
        file_size = StorageManager.get_file_size(path)

        input = Database.get_input(input_id)
        if input is None:
            self.raise_exc(Forbidden, "FORBIDDEN", "No such input")
        result = ContestManager.evaluate_output(
            input["task"],
            input["path"],
            path
        )

        Database.add_output(output_id, input_id, path, file_size, result)
        return { "id": output_id }

    def upload_source(self, route_args, request):
        """
        POST /upload_source
        """
        file_content = UploadHandler._get_file_content(request)
        file_name = UploadHandler._get_file_name(request)
        source_id = Database.gen_id()
        input_id = request.form["input"]

        path = StorageManager.new_source_file(source_id, file_name)
        StorageManager.save_file(path, file_content)
        file_size = StorageManager.get_file_size(path)

        Database.add_source(source_id, input_id, path, file_size)
        return { "id": source_id }

    @staticmethod
    def _get_file_name(request):
        """
        Extract the name of the file from the multipart body
        :param request: The Request object
        :return: The filename in the request
        """
        return request.files["file"].filename

    @staticmethod
    def _get_file_content(request):
        """
        Extract the content of the file from the multipart of the body
        :param request: The Request object
        :return: A *bytes* with the content of the file 
        """
        return request.files["file"].stream.getvalue()
