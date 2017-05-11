#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

"""This file can be imported instead of sqlite3 to make sure that
gevent and sqlite3 play nice together."""

import gevent.hub
import sqlite3
from functools import wraps

def _using_gevent_tp(method):
    @wraps(method, ['__name__', '__doc__'])
    def apply(*args, **kwargs):
        return gevent.hub.get_hub().threadpool.apply(method, args, kwargs)
    return apply


class Cursor(sqlite3.Cursor):
    """ A greenlet-friendly wrapper around sqlite3.Cursor. """


for method in [sqlite3.Cursor.executemany,
               sqlite3.Cursor.executescript,
               sqlite3.Cursor.fetchone,
               sqlite3.Cursor.fetchmany,
               sqlite3.Cursor.fetchall,
               sqlite3.Cursor.execute]:
    setattr(Cursor, method.__name__, _using_gevent_tp(method))


class Connection(sqlite3.Connection):
    """ A greenlet-friendly wrapper around sqlite3.Connection. """

    def __init__(self, *args, **kwargs):
        # Workaround gevent's thread id monkey patching
        kwargs['check_same_thread'] = False
        super(Connection, self).__init__(*args, **kwargs)

    def cursor(self):
        return Cursor(self)


for method in [sqlite3.Connection.commit,
               sqlite3.Connection.rollback,
               sqlite3.Connection.execute]:
    setattr(Connection, method.__name__, _using_gevent_tp(method))


@wraps(sqlite3.connect)
def connect(*args, **kwargs):
    kwargs['factory'] = Connection
    return sqlite3.connect(*args, **kwargs)
