# Communication system

Service for broadcasting announcements and collecting questions during the contest.
The backend of this service is written in Rust using actix-web and using sqlite3 as a DBMS.

## How to build the backend

- Install stable Rust, for example using `rustup`
- Run `cargo build --release` in the `backend/` folder to build the backend
- You will find the server binary in `backend/target/release/terry-communication-backend`.

## Database

The backend requires a database file (default: `db.sqlite3`) already initialized with the correct schema.
You can setup the database with `sqlite3 db.sqlite3 < schema.sql`.

The structure of the tables is pretty simple:

### `users`

All the users should be listed here, both admins and contestants.
The token column identifies the user and should be kept secret and shared only with the corresponding user.
This is especially important for the tokens of the admins, since they can see all the questions and publish answers and announcements.

The `isAdmin` column should be set to `1` for the admins and to `0` for the contestants.

### `questions`

This table gets filled by the backend when new questions and answers are posted.

### `announcements`

This table gets filled by the backend when new announcements are posted.