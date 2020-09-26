FROM python:3.8

EXPOSE 80

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -

RUN apt-get update

# Dependencies to keep
RUN apt-get install -y \
  python \
  python-wheel \
  python-pip \
  python-numpy \
  python-sortedcontainers \
  python3 \
  python3-wheel \
  python3-pip \
  python3-numpy \
  python3-sortedcontainers \
  nginx

# Dependencies to later delete
RUN apt-get install -y \
  git \
  libffi-dev \
  nodejs

# build terry
RUN set -x && \
    git clone --recursive https://github.com/algorithm-ninja/terry /terry && \
    cd /terry/backend && \
    pip3 install -I -r requirements.txt && \
    ./setup.py install && \
    cd /terry/frontend && \
    npm install && \
    npm run build && \
    cp -r build /app && \
    cd / && \
    rm -rf /terry && \
    apt-get purge -y git libffi-dev nodejs

ADD start.sh /
ADD nginx.conf /etc/nginx/nginx.conf
ADD default.config.yaml /

CMD ["/start.sh"]
