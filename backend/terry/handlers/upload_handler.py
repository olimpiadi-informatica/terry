#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>
# Copyright 2017 - Massimo Cairo <cairomassimo@gmail.com>

import time
from werkzeug.exceptions import InternalServerError, BadRequest, Forbidden

from terry.handlers.base_handler import BaseHandler
from terry.handlers.info_handler import InfoHandler
from terry.contest_manager import ContestManager
from terry.database import Database
from terry.detect_exe import get_exeflags
from terry.logger import Logger
from terry.storage_manager import StorageManager
from terry.validators import Validators


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
        try:
            path = StorageManager.new_output_file(output_id, file["name"])
        except ValueError:
            BaseHandler.raise_exc(
                BadRequest, "INVALID_FILENAME", "The provided file has an invalid name"
            )
        StorageManager.save_file(path, file["content"])
        file_size = StorageManager.get_file_size(path)

        expiry_date = Database.get_user_task(input["token"], input["task"])["attempt_expiry_date"]
        if expiry_date is not None:
            if time.time() > expiry_date:
                Logger.info(
                    "UPLOAD", "User %s has uploaded the output %s too late" % (input["token"], output_id)
                )
                BaseHandler.raise_exc(
                    Forbidden, "INPUT_EXPIRED", "The input file has expired"
                )

        try:
            result = ContestManager.evaluate_output(input["task"], input["path"], path)
        except:
            BaseHandler.raise_exc(
                InternalServerError, "INTERNAL_ERROR", "Failed to evaluate the output"
            )

        Database.add_output(output_id, input["id"], path, file_size, result)
        Logger.info(
            "UPLOAD", "User %s has uploaded the output %s" % (input["token"], output_id)
        )
        return InfoHandler.patch_output(Database.get_output(output_id))

    @Validators.during_contest
    @Validators.register_user_ip
    @Validators.validate_input_id
    @Validators.validate_file
    def upload_source(self, input, file):
        """
        POST /upload_source
        """
        alerts = []
        if get_exeflags(file["content"]):
            alerts.append(
                {
                    "severity": "warning",
                    "message": "You have submitted an executable! Please send the "
                    "source code.",
                }
            )
            Logger.info("UPLOAD", "User %s has uploaded an executable" % input["token"])
        if not alerts:
            alerts.append(
                {"severity": "success", "message": "Source file uploaded correctly."}
            )

        source_id = Database.gen_id()
        try:
            path = StorageManager.new_source_file(source_id, file["name"])
        except ValueError:
            BaseHandler.raise_exc(
                BadRequest, "INVALID_FILENAME", "The provided file has an invalid name"
            )

        StorageManager.save_file(path, file["content"])
        file_size = StorageManager.get_file_size(path)

        Database.add_source(source_id, input["id"], path, file_size)
        Logger.info(
            "UPLOAD", "User %s has uploaded the source %s" % (input["token"], source_id)
        )
        output = BaseHandler.format_dates(Database.get_source(source_id))
        output["validation"] = {"alerts": alerts}
        return output
