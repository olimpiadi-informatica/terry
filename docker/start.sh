#!/usr/bin/env sh

mkdir -p /run/nginx
mkdir -p /data/logs/nginx
chown -R www-data:www-data /data/logs/nginx

cd /data

[ ! -f config.yaml ] && cp /default.config.yaml config.yaml

terr-server -c /data/config.yaml 2>&1 | tee -a /data/logs/terr-server.log &

nginx -g 'daemon off;' &

if [ -f /terry-communication-backend ]; then
    export RUST_LOG=info
    options=""
    # fetch the telegram configuration from the env
    if [ ! -z "$TELEGRAM_TOKEN" ]; then
        options="$options --token=$TELEGRAM_TOKEN"
        if [ ! -z "$TELEGRAM_CHANNEL_ID" ]; then
            options="$options --channel-id=$TELEGRAM_CHANNEL_ID"
        else
            echo "To enable the telegram bot pass also '-e TELEGRAM_CHANNEL_ID=-1001111111111'"
            exit 2
        fi
        if [ ! -z "$TELEGRAM_ADMIN_URL" ]; then
            options="$options --admin-url=$TELEGRAM_ADMIN_URL"
        else
            echo "To enable the telegram bot pass also '-e TELEGRAM_ADMIN_URL=https://somewhere.online/admin/communication'"
            exit 2
        fi
    fi

    /terry-communication-backend \
        --database /data/terry-communication-backend.sqlite3 \
        --bind 127.0.0.1:1236 \
        $options 2>&1 \
    | tee -a /data/logs/terry-communication-backend.log &
fi

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
