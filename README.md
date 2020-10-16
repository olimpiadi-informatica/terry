# terry
[![Build Status](https://travis-ci.com/algorithm-ninja/terry.svg?branch=master)](https://travis-ci.com/algorithm-ninja/terry)
[![Code Climate](https://codeclimate.com/github/algorithm-ninja/terry/badges/gpa.svg)](https://codeclimate.com/github/algorithm-ninja/terry)
[![Coverage Status](https://coveralls.io/repos/github/algorithm-ninja/terry/badge.svg?branch=master)](https://coveralls.io/github/algorithm-ninja/terry?branch=master)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](https://github.com/algorithm-ninja/terry)
[![license](https://img.shields.io/github/license/algorithm-ninja/terry.svg)](https://github.com/algorithm-ninja/terry/blob/master/LICENSE)

**terry** is a Google-Code-Jam-like programming contest environment designed for the territorial phase of the Italian Olympiad in Informatics (OII, _Olimpiadi Italiane di Informatica_).

## Specification of the terry format

You can find the specification of the format accepted by `terry` [here](https://github.com/algorithm-ninja/terry/blob/master/format-specs.md).

## Setup a production-like environment

1. Clone recursively this repo `git clone --recurse-submodules https://github.com/algorithm-ninja/terry`
2. Follow the instructions in `backend/`
3. Place the zip of the contest in the folder set in the backend config file
4. Setup the frontend

- Inside `frontend/`
- export some frontend variables: `REACT_APP_API_BASE_URI` `REACT_APP_FILES_BASE_URI` `REACT_APP_STATEMENTS_BASE_URI` `REACT_APP_DETECT_INTERNET_TEST_ENDPOINT` `REACT_APP_DETECT_INTERNET_TEST_CONTENT`
- `npm install`
- `npm run build`

5. Setup the reverse proxy (or some form of frontend server), consider using the `vm-utils/nginx.conf` file as a template.
6. Start the backend running `terr-server`
7. Start the proxy

The provided nginx configuration file assumes:

- `REACT_APP_API_BASE_URI=`http://localhost/api/
- `REACT_APP_FILES_BASE_URI=`http://localhost/files/
- `REACT_APP_STATEMENTS_BASE_URI=`http://localhost/statements/

You have put this repo inside `/app` directory in the server. The backend is configured to use the default port 1234.
Remember to configure the backend with (at least this changes):

```yaml
address: 127.0.0.1
admin_token: SOMETHING DIFFERENT FROM THE DEFAULT
num_proxy: 1
```

### Using Docker

Inside the `docker` folder there are the files needed for building a docker container with the backend and frontend.
You can also find a prebuilt image in [Docker Hub](https://hub.docker.com/r/edomora97/terry).

To use the docker image you should mount a folder to `/data` inside the container.
After the first startup of the container the default configuration file is created, you can customize it and restart the container.
All the data is persisted inside `/data`, mounting that folder as a volume makes sure you won't lose any data by recreating the container.

The container exposes port 80, where `nginx` is configured to serve the backend and the frontend.
With `-P` that port will be mapped to a random local port, you may want to use `-p 12345:80` to fix the exported port.

```sh
docker run -d -v $(pwd)/storage:/data -P edomora97/terry:latest
```

The nginx and terr-server logs are stored inside `/data/logs`.

You can use the `build_docker.py` script to ease the building of the docker image.
Passing `--communication internal` it will setup the container to spawn also the communication server.

## Build the server VM

1. Clone with `--recursive` this repo
2. Have virtualbox installed
3. Ensure that the settings at the top of the Makefile are good for you
4. Run `sudo make build ROOT_PASSWORD=XXXXX CONFIG_YAML=vm-utils/config.yaml NGINX_CONF=vm-utils/nginx.conf HTTPTUN_SERVER=http://XXXXX HTTPTUN_PASSWORD=XXXXX VERSION=XXXXX`
5. Run `sudo make server.ova`

A `server.ova` file has been generated, import it in VirtualBox!

## Utility scripts

You'll need some configuration files in order to make a valid pack using the utilities in this repo:

- A CSV file with the contestant information: `atleti.csv`
- A CSV with the venues: `sedi.csv`
- A YAML file with the contest metadata: `metadata.yaml`

#### atleti.csv

This CSV contains the list and information about all the contestants, there are some required columns:

- `Nome` (the contestant's name)
- `Cognome` (the contestant's surname)
- `sede` (the contestant's venue)

All the other columns will be kept in the `contest.yaml` generated files but won't be stored in the DB.
The contestant is identified by a randomly generated token, it will be put in the `contest.yaml` file its venue.

#### sedi.csv

This CSV contains all the venues and the number of rooms in each of them. The required columns are:

- `sede` (the venue's code)
- `aule` (the number of rooms)

The venue's code must be from 3 to 4 characters long, usually it's in the format `FRI` or `LOM1`, `LOM2`, ...

The room identifier will be the venue's code with the 1-based index of the room, padded to be 6 characters long. For example `FRI001`, `FRI002`, `LOM101`, `LOM102`, ...

#### metadata.yaml

This files contains the basic information about a contest.

That file is present, unencrypted, in the contest pack.
It will be shown in the admin page before the contest extraction.
The content of this file is also used to make the `contest.yaml` files, the name and description of the contest are get from there.

You can find the specification of the format of this file [here](https://github.com/algorithm-ninja/terry/blob/master/format-specs.md#public-metadata).

### Making a pack

Once you have made all the configuration files and prepared all the tasks for the contest you can use the following utilities for preparing the pack and the extra files for the contest.

1. Choose the encryption password: an hex string of 14 characters long, for example `aabbccddeeff00`

2. Make the credentials for the contestants and admins:

   - `util/make_cred.py metadata.yaml 10800 task1,task2,task3 sedi.csv atleti.csv --password aabbccddeeff00 --num-backup 5 __users__ > admin.csv`
   - `metadata.yaml` is where to get the name/description of the contest. Note that it could be different from the one used in the next step, this one has no size limit.
   - `10800` is the contest duration in seconds.
   - `task1,task2,task3` are the task names separated with commas.
   - `--num-backup 5` will create 5 extra users for each venue, in case of emergencies.
   - `__users__` is the destination folder, inside of it all the `contest.yaml` files for each room will be created. The folder will be created automatically.
   - Specifying `--password aabbccddeeff00` the stdout will contain the content of the file `admin.csv` with the columns: `sede` (the venue's code), `full_sede` (the code with the room number) and `password` (a valid admin token for that room).

3. Make the `pack.zip.enc` file:

   - `util/make_pack.py --task-maker --both-arch aabbccddeeff00 metadata.yaml pack.zip.enc __users__ path/to/task1 path/to/task2 path/to/task3 --tutorials path/to/tutorials`
   - `--task-maker` is **highly** suggested, will use task-maker to build the tasks.
   - `--both-arch` will make the executables for both `i686` and `x86_64`.
   - `metadata.yaml` the 1KiB limited file with the contest metadata.
   - `pack.zip.enc` is where to store the resulting pack, the name can be different.
   - `__users__` is the folder created with the previous command.
   - `path/to/task1 ...` are the paths to the tasks to build.
   - `--tutorials path/to/tutorials` is an optional path to the directory where the tutorials are stored.

4. Make the slips of paper with the contestants' credentials:
   - `util/genera_foglietti.py sedi.csv __users__ outdir`
   - Will create a PDF for each venue inside outdir.
   - Otherwise you can generate manually each PDF with:
   - `util/foglietti.py FRI path/to/FRI001.yaml dest/FRI.pdf`
   - Will create `dest/FRI.pdf`, an easily cuttable, printable PDF with all the tokens for the contestants of `FRI`.

### After contest utilities

All those scripts assume that all the result zips from the contest are stored in the same directory `zip_dir`.

#### Making the scoreboard

```bash
util/make_scoreboard.py zip_dir scoreboard.csv --patch patch.csv
```

The `patch.csv` file allows you to change the venue of a contestant after the contest is done.
For example if someone took the contest in a different venue from his one you can patch that.
The columns of this file are: `old` (the old venue), `new` (the new venue), `token` (the token of the user).

The resulting csv will have the following columns: `venue`, `surname`, `name`, a column per task, `score` (the total score).
