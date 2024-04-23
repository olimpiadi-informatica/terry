#!/usr/bin/env python3
import contextlib

import os.path
import zipfile


@contextlib.contextmanager
def remember_cwd(newdir):
    curdir = os.getcwd()
    os.chdir(newdir)
    try:
        yield
    finally:
        os.chdir(curdir)


@contextlib.contextmanager
def connect_to_dir(dbdir):
    from terry.config import Config
    from terry.database import Database
    from terry.logger import Logger

    db_path = os.path.join(dbdir, "db.sqlite3")
    log_path = os.path.join(dbdir, "log.sqlite3")
    Config.db = db_path
    Config.logfile = log_path
    Database.connect_to_database()
    Logger.connect_to_database()
    try:
        yield
    finally:
        Database.disconnect_database()
        Logger.disconnect_database()


@contextlib.contextmanager
def extract_and_connect(path, workdir):
    from terry.config import Config
    from terry.database import Database
    from terry.logger import Logger

    with zipfile.ZipFile(path) as f:
        f.extractall(workdir)
    db_path = os.path.join(workdir, "db.sqlite3")
    log_path = os.path.join(workdir, "log.sqlite3")
    Config.db = db_path
    Config.logfile = log_path
    Database.connect_to_database()
    Logger.connect_to_database()
    try:
        yield
    finally:
        Database.disconnect_database()
        Logger.disconnect_database()


def get_tasks():
    from terry.database import Database

    return [t["name"] for t in Database.get_tasks()]
