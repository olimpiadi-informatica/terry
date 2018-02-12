#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2018 - Luca Versari <veluca93@gmail.com>

import base64

import nacl
import nacl.hash
import nacl.pwhash
import nacl.secret

NACL_SALT = bytes.fromhex(
    "5b6a78a780ea0ee560442cf5a528f0fb743d79e45a3a33af68671eba9cde0e17")
SECRET_LEN = 3
USERNAME_LEN = 6

HASH_LEN = 32
VERSION_LEN = 1
METADATA_LEN = 1024
VERSION_OFFSET = HASH_LEN
METADATA_OFFSET = HASH_LEN + VERSION_LEN
DATA_OFFSET = METADATA_OFFSET + METADATA_LEN


def user_to_bytes(user: str):
    if not all('A' <= x <= 'Z' or '0' <= x <= '9' or x == '_' for x in user):
        raise ValueError("Invalid username")
    return user.encode('ascii')


def combine_username_password(username: str, password: str):
    return username + "-" + password


def encode_data(user: str, data: bytes):
    b32data = base64.b32encode(data)
    if b32data[-1] == ord('='):
        raise ValueError(
            "Invalid secret + password length: %s" % b32data.decode('ascii'))
    return combine_username_password(user, '-'.join(
        b32data[i:i + 4].decode('ascii') for i in range(0, len(b32data), 4)))


def decode_data(b32data: str, secret_len: int):
    filtered_data = "".join(filter(lambda x: x != '-', b32data))
    data = base64.b32decode(filtered_data.encode('ascii'))
    return (data[:secret_len], data[secret_len:])


def gen_user_password(user: str, secret: bytes, file_password: bytes):
    digest = nacl.hash.sha512(user_to_bytes(user) + secret)
    digest = base64.b16decode(digest, casefold=True)
    if len(file_password) > len(digest):
        raise ValueError("File password is too long")
    scrambled_password = bytes(
        [v ^ digest[i] for i, v in enumerate(file_password)])
    return encode_data(user, secret + scrambled_password)


def recover_file_password(user: str, secret: bytes, scrambled_password: bytes):
    digest = nacl.hash.sha512(user_to_bytes(user) + secret)
    digest = base64.b16decode(digest, casefold=True)
    if len(scrambled_password) > len(digest):
        raise ValueError("Scrambled password is too long")
    file_password = bytes(
        [v ^ digest[i] for i, v in enumerate(scrambled_password)])
    return file_password


def password_to_key(password: bytes):
    ops = nacl.pwhash.scrypt.OPSLIMIT_MODERATE
    mem = nacl.pwhash.scrypt.MEMLIMIT_MODERATE
    length = nacl.secret.SecretBox.KEY_SIZE
    return nacl.pwhash.scrypt.kdf(
        length, password, NACL_SALT, opslimit=ops, memlimit=mem)


def encode(password: bytes, input_data: bytes, metadata: bytes):
    key = password_to_key(password)
    box = nacl.secret.SecretBox(key)
    encrypted = box.encrypt(input_data)
    if len(metadata) > METADATA_LEN:
        raise ValueError("Metadata is too long")
    metadata += '\x00' * (METADATA_LEN - len(metadata))
    sha = nacl.hash.sha256(b'\x00' + metadata + input_data)
    return base64.b16decode(
        sha, casefold=True) + b'\x00' + metadata + encrypted


def validate(input_data: bytes):
    sha = input_data[:VERSION_OFFSET]
    return sha == nacl.hash.sha256(input_data[VERSION_OFFSET:])


def metadata(input_data: bytes):
    return input_data[METADATA_OFFSET:DATA_OFFSET]


def decode(password: bytes, input_data: bytes):
    key = password_to_key(password)
    box = nacl.secret.SecretBox(key)
    return box.decrypt(input_data[DATA_OFFSET:])
