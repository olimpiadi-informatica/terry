#!/usr/bin/env sh

mkdir -p /run/nginx
mkdir -p /data/logs/nginx
chown -R nginx:nginx /data/logs/nginx

cd /data

[ ! -f config.yaml ] && cp /default.config.yaml config.yaml

terr-server -c /data/config.yaml 2>&1 | tee -a /data/logs/terr-server.log &

nginx -g 'daemon off;' &

sleep 2s

while true; do
    ps | grep nginx | grep -v grep >/dev/null
    if [ $? -ne 0 ]; then
        echo "Nginx is down" >&2
        exit 1
    fi

    ps | grep terr-server | grep -v grep >/dev/null
    if [ $? -ne 0 ]; then
        echo "terr-server is down" >&2
        exit 1
    fi

    sleep 5s
done
