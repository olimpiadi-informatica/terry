FROM rust:1.69 as builder

COPY src/ /build/src
COPY Cargo.toml /build
COPY Cargo.lock /build
COPY schema.sql /build
COPY .cargo /build

WORKDIR /build
RUN cargo build --release


# ----------------------------


FROM debian:stable-slim

ADD docker/start.sh /
COPY --from=builder /build/target/release/terry-communication-backend /terry-communication-backend

VOLUME [ "/data" ]
EXPOSE 1236

CMD ["/start.sh"]
