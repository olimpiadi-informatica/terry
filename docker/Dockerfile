FROM python:3.8-slim

ARG REACT_APP_COMMUNICATIONS_BASE_URI=
ARG TERRY_BRANCH=master
EXPOSE 80

# Setup terry
ADD setup.sh /
RUN /setup.sh

ADD start.sh /
ADD nginx.conf /etc/nginx/nginx.conf
ADD default.config.yaml /

CMD ["/start.sh"]
