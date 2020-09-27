FROM python:3.8

EXPOSE 80

# Setup terry
ADD setup.sh /
RUN /setup.sh

ADD start.sh /
ADD nginx.conf /etc/nginx/nginx.conf
ADD default.config.yaml /

CMD ["/start.sh"]
