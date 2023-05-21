#!/usr/bin/env sh

set -ex

mkdir -p /data/logs
cd /data

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
    --bind 0.0.0.0:1236 \
    $options 2>&1 \
| tee -a /data/logs/terry-communication-backend.log
