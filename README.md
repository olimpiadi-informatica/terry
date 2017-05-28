# territoriali-backend
[![Build Status](https://travis-ci.org/algorithm-ninja/territoriali-backend.svg?branch=master)](https://travis-ci.org/algorithm-ninja/territoriali-backend)
[![Code Climate](https://codeclimate.com/github/algorithm-ninja/territoriali-backend/badges/gpa.svg)](https://codeclimate.com/github/algorithm-ninja/territoriali-backend)
[![Coverage Status](https://coveralls.io/repos/github/algorithm-ninja/territoriali-backend/badge.svg?branch=master)](https://coveralls.io/github/algorithm-ninja/territoriali-backend?branch=master)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](https://github.com/algorithm-ninja/territoriali-backend)
[![license](https://img.shields.io/github/license/algorithm-ninja/territoriali-backend.svg)](https://github.com/algorithm-ninja/territoriali-backend/blob/master/LICENSE)

**territoriali-backend** is a GoogleCodejam-like programming contest environment designed for the territorial phase of
the Italian Olympiad of Informatics (OII, _Olimpiadi Italiane di Informatica_).

This is only the backend of the project, if you are looking for the frontend please go to
[territoriali-frontend](https://github.com/algorithm-ninja/territoriali-frontend)

This is a new project, it's not stable yet! Please note that our licence does not provide any warranty.

## The goals

The environment where this system will run can be vary, it is designed to run in a virtual machine with Linux hosted by
a Windows server in a school lab. Because the schools usually don't have many resources, this software has to be **as
light as possible**.

We specifically support **only Linux**, other operating systems could work but we don't offer any support. 

The authentication at this point is very simple, only a token identifies a user. This because the contest that will run
in this system is run in a **safe environment**. The administrator of the site (the referent at the school) distributes
to the students the credentials and they will keep them secret. There are some security policy to prevent cheating by
sharing the token.

Like Google Codejam there are **many tasks** in a contest, the score of the user is the sum of the score for each task.
After the contest begins the users may download the task statements. When a user want to try to submit his solution a
**unique input** with **many testcases** is generated for the user. The user downloads the input file, executes its
program with the input and generate an output. After he has produced the output file he can **submit the output and the
source**. The system stores these files and processes the output computing a **validation** and an **outcome**.

The **validation** feedback is displayed immediately to the user, it will contain some information about the parsing of
the output file. The **score is kept secret** until the user is sure to have uploaded the correct files. Before
submitting the user can change the submitted output as many times as he wants, the score is kept secret.

When the user is sure he will **submit**, this action locks the last input file and shows the score of the submission.


## How it works

The virtual machine given to the referents contains a zip file protected with a password. When the contest is about to
begin the unlock password is told to the referents, they will unlock the zips and the contest is ready.

To start the contest the referent will make (through the browser) an API request and the contest is unlocked for the
students.

Before the start of the contest a pool of pre-generated input files is made and put into a queue. This allows a faster
user experience. When a new input is needed a **generator** is called with a random seed, this program will produce an
input that (if possible) is validated by a **validator**. If the input is valid it's put in the same queue as before.

When a user submits it's output a **checker** is called with the input file and the output file as parameters. The
checker will output a JSON object with many information: the score of the submission, a public validation outcome
(testcase per testcase with a description) and a private (visibile only after submitting) outcome.


## How to install and run

This is a **Python 3** project, you have to have `Python >= 3.4` installed (PyPy is also supported).

We suggest you to use `virtualenv` to manage your python environment.

You need to install some python modules, this can easily be done using `pip`:
```bash
pip install -r requirements.txt
```
Please note that you may need to run the above command as root (with `sudo`) if you don't use `virtualenv`.

Then you need to install the server, thanks to `setuptools` this can be done with
```bash
./setup.py install
```
Like above you may need to run the command as root.

Now you should have the `terr-server` command that starts the server. Before running that you need to create a config
file. The easiest way to do that is to copy the provided example
```bash
cp config/example.config.yaml config/config.yaml
```
You may want to customize the configuration in the `config/config.yaml` file, we encourage you to **at least CHANGE THE
ADMIN TOKEN**. Using the default token is a serious security issue!

After you have customized the configuration you should be ready to run the server with
```bash
terr-server
```

If you want to run the tests, maybe because you are working on this project, you need to run
```bash
./run_tests.py
```
