FROM python:3.8

EXPOSE 80

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -

# Dependencies to keep
RUN apt-get update && apt-get install -y \
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

# Setup terry
ADD setup.sh /
RUN /setup.sh

ADD start.sh /
ADD nginx.conf /etc/nginx/nginx.conf
ADD default.config.yaml /

CMD ["/start.sh"]
