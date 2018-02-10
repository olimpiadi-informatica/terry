#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

import base64
import nacl
import nacl.hash
import nacl.pwhash
import nacl.secret

NACL_SALT = bytes.fromhex("0d44ed211e4b5eac161b80d09e485f4597a1c1e6")


def user_to_bytes(user: str):
    if not all('A' <= x <= 'Z' or '0' <= x <= '9' or x == '_' for x in user):
        raise ValueError("Invalid username")
    return user.encode('ascii')


def encode_data(user: str, data: bytes):
    b32data = base64.b32encode(data)
    if b32data[-1] == ord('='):
        raise ValueError(
            "Invalid secret + password length: %s" % b32data.decode('ascii'))
    return user + '-' + '-'.join(b32data[i:i + 4].decode('ascii')
                                 for i in range(0, len(b32data), 4))


def decode_data(b32data: str, secret_len: int):
    filtered_data = "".join(filter(lambda x: x != '-', b32data))
    data = base64.b32decode(filtered_data.encode('ascii'))
    return (data[:secret_len], data[secret_len:])


def gen_user_password(user: str, secret: bytes, file_password: bytes):
    digest = nacl.hash.sha512(user_to_bytes(user) + secret)
    if len(file_password) > len(digest):
        raise ValueError("File password is too long")
    scrambled_password = bytes(
        [v ^ digest[i] for i, v in enumerate(file_password)])
    return encode_data(user, secret + scrambled_password)


def recover_file_password(user: str, secret: bytes, scrambled_password: bytes):
    digest = nacl.hash.sha512(user_to_bytes(user) + secret)
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


def encode(password: bytes, input_data: bytes):
    key = password_to_key(password)
    box = nacl.secret.SecretBox(key)
    return box.encrypt(input_data)


def decode(password: bytes, input_data: bytes):
    key = password_to_key(password)
    box = nacl.secret.SecretBox(key)
    return box.decrypt(input_data)
