FROM alpine

RUN apk add python3 py3-pip && \
    pip3 install prometheus-client

ADD exporter.py /

ENTRYPOINT ["/exporter.py"]
CMD ["/data/db.sqlite3"]