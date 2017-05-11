#!/usr/bin/env python3

import os
from setuptools import setup, find_packages


def read(fname):
    return open(os.path.join(os.path.dirname(__file__), fname)).read()

setup(
    name="territoriali-backend",
    version="0.0.1",
    author="Edoardo Morassutto, Dario Ostuni, Luca Versari",
    author_email="edoardo.morassutto@gmail.com, dario.ostuni@gmail.com, veluca93@gmail.com",
    description="A simple to use backend for the regional phase of Olimpiadi Italiane di Informatica",
    license="MPL-2.0",
    keywords="informatics contests",
    url="https://github.com/algorithm-ninja/territoriali-backend",
    packages=find_packages(),
    long_description=read("README.md"),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Environment :: Console",
        "License :: OSI Approved :: Mozilla Public License 2.0 (MPL 2.0)",
        "Natural Language :: English",
        "Operating System :: POSIX :: Linux",
        "Programming Language :: Python :: 3 :: Only",
        "Topic :: Scientific/Engineering"
    ],
    entry_points={
        "console_scripts": []
    }
)
