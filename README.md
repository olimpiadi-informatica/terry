# terry
[![Tests](https://github.com/olimpiadi-informatica/terry/actions/workflows/test.yml/badge.svg)](https://github.com/olimpiadi-informatica/terry/actions/workflows/test.yml)
[![Code Climate](https://codeclimate.com/github/olimpiadi-informatica/terry/badges/gpa.svg)](https://codeclimate.com/github/olimpiadi-informatica/terry)
[![Coverage Status](https://coveralls.io/repos/github/olimpiadi-informatica/terry/badge.svg?branch=master)](https://coveralls.io/github/olimpiadi-informatica/terry?branch=master)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](https://github.com/olimpiadi-informatica/terry)
[![license](https://img.shields.io/github/license/olimpiadi-informatica/terry.svg)](https://github.com/olimpiadi-informatica/terry/blob/master/LICENSE)

**terry** is a Google-Code-Jam-like programming contest environment designed for the territorial phase of the Italian Olympiad in Informatics (OII, _Olimpiadi Italiane di Informatica_).

## Setup

### Prerequisites

- **Rust** (latest stable)
- **Node.js** and **yarn**
- **SQLite**

### 1. Clone the repository

```bash
git clone https://github.com/olimpiadi-informatica/terry
cd terry
```

### 2. Build the Frontend

```bash
cd frontend
yarn install
yarn compile
yarn build
cd ..
```

### 3. Build the Backend

```bash
cd backend
SQLX_OFFLINE=true cargo build --release
```

### 4. Configuration

Edit the `config.toml` file in the `backend` directory to configure your contest settings (name, duration, start time, JWT secrets, etc.).

### 5. Database Setup

Set the `DATABASE_URL` environment variable and create the database:

```bash
touch terry.db
export DATABASE_URL="sqlite:terry.db"
```

The server will automatically run migrations on startup.

## CLI Usage

The `terry` binary (found in `backend/target/release/terry`) provides several subcommands:

### Start the Server

```bash
terry serve --config config.toml --listen 127.0.0.1:9000
```

### Import a Task

Tasks must follow the [terry format specification](format-specs.md).

```bash
terry import-task /path/to/task-folder 1
```

### Import a User

```bash
terry import-user --token "user-secret-token" --name "John" --surname "Doe"
```

To import an admin:

```bash
terry import-user --token "admin-secret-token" --name "Admin" --surname "User" --role admin
```

To import multiple users from CSV:

```bash
terry import-user --csv users.csv
```

The CSV file must include `token,name,surname` headers and may optionally include a `role`
column. If the `role` column is omitted or empty, the command uses `--role` as the default:

```csv
token,name,surname,role
alice,Alice,Smith,Contestant
bob,Bob,Jones,Admin
charlie,Charlie,Brown,
```

### Export Results

Exports a ranking CSV and all submissions (including source, input, and output files).

```bash
terry export /path/to/export-dir
```

To skip exporting submissions whose score is `0` or lower:

```bash
terry export /path/to/export-dir --filter-zero-score
```

To export submissions without their input files:

```bash
terry export /path/to/export-dir --skip-inputs
```

## Specification of the terry format

You can find the specification of the format accepted by `terry` [here](format-specs.md).
