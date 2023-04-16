FROM alpine:latest

EXPOSE 1236
WORKDIR /data
ENV RUST_LOG=info

ADD terry-communication-backend /
ADD start.sh /

CMD ["/start.sh"]
