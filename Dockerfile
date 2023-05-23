# ------------------------------------------------------
# FRONTEND
# ------------------------------------------------------

FROM node:lts-buster-slim AS frontend-builder

WORKDIR /frontend

# Cache dependencies
COPY frontend/package.json /frontend/package.json
COPY frontend/yarn.lock /frontend/yarn.lock
RUN yarn install --frozen-lockfile

ARG REACT_APP_COMMUNICATIONS_BASE_URI=
COPY frontend /frontend

ENV NODE_ENV=production
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true
RUN yarn build


# ------------------------------------------------------
# BACKEND
# ------------------------------------------------------

FROM python:3.11-slim AS backend-builder

WORKDIR /terry

COPY backend/requirements.txt /terry/requirements.txt
RUN pip install -I -r requirements.txt

COPY backend /terry
RUN ./setup.py install


# ------------------------------------------------------
# COMMUNICATION
# ------------------------------------------------------

FROM rust:1.69 as communication-builder

COPY communication/src /build/src
COPY communication/Cargo.toml /build
COPY communication/Cargo.lock /build
COPY communication/schema.sql /build
COPY communication/.cargo /build

WORKDIR /build
RUN cargo build --release


# ------------------------------------------------------
# FINAL IMAGE
# ------------------------------------------------------

FROM python:3.11-slim AS without-communication

# Install system dependencies and task dependencies
RUN apt-get update && \
    apt-get install -y curl nginx procps zip '^python3?$' '^python3?-(wheel|pip|numpy|sortedcontainers)$' && \
    curl https://bootstrap.pypa.io/pip/2.7/get-pip.py | python2 && \
    pip2 install numpy sortedcontainers

# Frontend
COPY --from=frontend-builder /frontend/build /app

# Backend
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin
COPY docker/default.config.yaml /default.config.yaml

# Nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Startup script
EXPOSE 80
COPY docker/start.sh /start.sh
CMD ["/start.sh"]


# ------------------------------------------------------
# FINAL IMAGE WITH COMMUNICATION
# ------------------------------------------------------

FROM without-communication AS with-communication

COPY --from=communication-builder /build/target/release/terry-communication-backend /terry-communication-backend

VOLUME [ "/data" ]


# ------------------------------------------------------
# FINAL IMAGE ONLY COMMUNICATION
# ------------------------------------------------------

FROM debian:stable-slim AS only-communication

ADD communication/docker/start.sh /
COPY --from=communication-builder /build/target/release/terry-communication-backend /terry-communication-backend

VOLUME [ "/data" ]
EXPOSE 1236

CMD ["/start.sh"]
