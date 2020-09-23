FROM alpine

EXPOSE 80

RUN apk add --no-cache python3 python2 git

# build terry
RUN set -x && \
    apk add --no-cache gcc python3-dev py3-pip py3-wheel py3-numpy py3-sortedcontainers python2-dev musl-dev libffi-dev file make nginx npm && \
    git clone --recursive https://github.com/algorithm-ninja/terry /terry && \
    cd /terry/backend && \
    pip3 install -I -r requirements.txt && \
    ./setup.py install && \
    cd /terry/territoriali-frontend && \
    npm install && \
    npm run build && \
    cp -r build /app && \
    cd / && \
    rm -rf /terry && \
    python2 -m ensurepip && \
    pip2 install sortedcontainers numpy && \
    apk del gcc python3-dev python2-dev musl-dev libffi-dev file make npm git

ADD start.sh /
ADD nginx.conf /etc/nginx/nginx.conf
ADD default.config.yaml /

CMD ["/start.sh"]
