# Communication system

Service for broadcasting announcements and collecting questions during the contest.
The backend of this service is written in Rust using actix-web and using sqlite3 as a DBMS.

## How to build the backend

- Install stable Rust, for example using `rustup`
- Run `cargo build --release` in the `backend/` folder to build the backend
- You will find the server binary in `backend/target/release/terry-communication-backend`.