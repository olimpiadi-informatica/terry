FROM alpine:latest

EXPOSE 1236
WORKDIR /data
ENV RUST_LOG=info

ADD terry-communication-backend /

ENTRYPOINT [ "/terry-communication-backend", "--bind", "0.0.0.0:1236" ]
