#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
import inspect


class HandlerParams:
    HANDLER_PARAMS_ATTR = "handler_params"

    @staticmethod
    def initialize_handler_params(handle, handler):
        if not hasattr(handle, HandlerParams.HANDLER_PARAMS_ATTR):
            if hasattr(handler, HandlerParams.HANDLER_PARAMS_ATTR):
                setattr(
                    handle,
                    HandlerParams.HANDLER_PARAMS_ATTR,
                    getattr(handler, HandlerParams.HANDLER_PARAMS_ATTR),
                )
            else:
                setattr(
                    handle,
                    HandlerParams.HANDLER_PARAMS_ATTR,
                    HandlerParams.get_handler_params(handler),
                )
        # forward the method name from the handler, useful for logging
        handle.__name__ = handler.__name__
        return handle

    @staticmethod
    def get_handler_params(handle):
        if hasattr(handle, HandlerParams.HANDLER_PARAMS_ATTR):
            return getattr(handle, HandlerParams.HANDLER_PARAMS_ATTR)
        params = {}
        sign = inspect.signature(handle).parameters

        for name in sign:
            if name == "self":
                continue
            if sign[name].annotation is not inspect._empty:
                type = sign[name].annotation
            else:
                type = None
            req = sign[name].default == inspect._empty

            params[name] = {"type": type, "required": req}
        return params

    @staticmethod
    def add_handler_param(handle, param, type, required=True):
        params = getattr(handle, HandlerParams.HANDLER_PARAMS_ATTR)
        params[param] = {"type": type, "required": required}
        return handle

    @staticmethod
    def remove_handler_param(handle, name):
        params = getattr(handle, HandlerParams.HANDLER_PARAMS_ATTR)
        if name in params:
            del params[name]
