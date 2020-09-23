# territoriali-backend
[![Build Status](https://travis-ci.org/algorithm-ninja/territoriali-backend.svg?branch=master)](https://travis-ci.org/algorithm-ninja/territoriali-backend)
[![Code Climate](https://codeclimate.com/github/algorithm-ninja/territoriali-backend/badges/gpa.svg)](https://codeclimate.com/github/algorithm-ninja/territoriali-backend)
[![Coverage Status](https://coveralls.io/repos/github/algorithm-ninja/territoriali-backend/badge.svg?branch=master)](https://coveralls.io/github/algorithm-ninja/territoriali-backend?branch=master)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](https://github.com/algorithm-ninja/territoriali-backend)
[![license](https://img.shields.io/github/license/algorithm-ninja/territoriali-backend.svg)](https://github.com/algorithm-ninja/territoriali-backend/blob/master/LICENSE)

**territoriali-backend** is a Google-Code-Jam-like programming contest environment designed for the territorial phase of
the Italian Olympiad in Informatics (OII, _Olimpiadi Italiane di Informatica_).

This is only the backend of the project, if you are looking for the frontend please go to
[territoriali-frontend](https://github.com/algorithm-ninja/territoriali-frontend)

This is a new project, it's not stable yet! Please note that our licence does not provide any warranty.

## The goals

This system was designed to run in a virtual machine running Linux, hosted by a Windows server in a high school lab.
Because schools usually don't have many resources, this software has to be **as light as possible**.

We specifically support **only Linux**, other operating systems could work but we don't offer any guarantee.

Authentication is very simple: only a token identifies a user. This because the contest that will be run
in this system is run in a **safe environment**. The administrator of the site (the referent at the school) distributes
the credentials to the students, that will keep them secret. There are some security policies that prevent cheating by
sharing the token.

Like Google Code Jam there are **many tasks** in a contest; the score of an user is the sum of the scores in each task.
After the contest begins, the users may download the task statements. When an user wants to try to submit his solution a
**unique input** with **many testcases** is generated for the user. The user downloads the input file, executes its
program with the input and generates an output. After he has produced the output file he can **submit the output and the
source**. The system stores these files and processes the output computing a **validation result** and an **outcome**.

The **validation** feedback is displayed immediately to the user. It contains some information about the parsing of
the output file, but **score is kept secret** until the user confirms that he wants to submit that output. Before
submitting the user can change the output as many times as he wants.

When the user **submits**, he is informed of the score he has obtained but can provide no more outputs for that
input file.


## How it works

The virtual machine given to the referents contains only the software, the referents have to upload an encrypted zip. When
the contest makers wants the contest to be ready (short before the contest should start) they distributes some passwords
to the referents. A password is a string composed by three parts: a `username` (which is unique), a `secret` and a
`scrambled_password` (the zip password xor-ed with an hash of `username + secret`).

The referent may start the contest using the browser.

Before the start of the contest a pool of pre-generated input files is created and put into a queue, allowing for a faster
user experience. As long as the queue is not full, a **generator** is called with a random seed, producing an
input that is (possibly) validated by a **validator**. If the input is valid it is enqueued.

When an user submits his output a **checker** is called with the input file and the output file as parameters. The
checker will output a JSON object containing the score of the submission, a public validation result
(testcase per testcase with a description) and a private (visibile only after submitting) outcome.


## How to install and run

This is a **Python 3** project, you must have `Python >= 3.4` installed (PyPy is also supported).

We suggest you to use `virtualenv` to manage your python environment.

You need to install some python modules, for example using `pip`:
```bash
pip install -r requirements.txt
```
Please note that you may need to run the above command as root (with `sudo`) if you don't use `virtualenv`.

Then you need to install the server:
```bash
./setup.py install
```
Like above you may need to run the command as root.

Now you should have the `terr-server` command, that starts the server. Before running that you need to create a config
file. The easiest way to do that is to copy the provided example
```bash
cp config/example.config.yaml config/config.yaml
```
You may want to customize the configuration in the `config/config.yaml` file.

After you have customized the configuration you should be ready to run the server with
```bash
terr-server
```

If you want to run the tests, maybe because you are working on this project, you need to run
```bash
./run_tests.py
```
