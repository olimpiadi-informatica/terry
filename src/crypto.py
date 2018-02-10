#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2018 - Luca Versari <veluca93@gmail.com>

import argparse
import base64
import os
import sys

import nacl
import nacl.hash
import nacl.pwhash
import nacl.secret

NACL_SALT = bytes.fromhex(
    "5b6a78a780ea0ee560442cf5a528f0fb743d79e45a3a33af68671eba9cde0e17")
SECRET_LEN = 3
USERNAME_LEN = 6


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
    return combine_username_password(user, '-'.join(b32data[i:i + 4].decode(
        'ascii') for i in range(0, len(b32data), 4)))


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


def gen_password_main():
    parser = argparse.ArgumentParser(
        description='Generate admin tokens for a given username')
    parser.add_argument(
        '--secret-len',
        type=int,
        help='number of bytes in the password secret',
        default=SECRET_LEN)
    parser.add_argument(
        '--username-len',
        type=int,
        help='username length',
        default=USERNAME_LEN)
    parser.add_argument('zip_password', help='hexified zip password')
    parser.add_argument(
        'username',
        help='username (read by stdin by default)',
        nargs='?',
        default='-')
    args = parser.parse_args()
    if args.username == '-':
        user = sys.stdin.readline().strip()
    else:
        user = args.username
    if len(user) != args.username_len:
        raise ValueError("Invalid username length")
    secret = os.urandom(args.secret_len)
    print(gen_user_password(user, secret, bytes.fromhex(args.zip_password)))


def crypt_file_main():
    parser = argparse.ArgumentParser(
        description='(De)Crypt a file according to a given password')
    parser.add_argument('-d', '--decrypt', action='store_true')
    parser.add_argument('zip_password', help='hexified zip password')
    parser.add_argument(
        'input_file',
        help='input file (stdin by default)',
        nargs='?',
        default='-')
    parser.add_argument(
        'output_file',
        help='output file (stdout by default)',
        nargs='?',
        default='-')
    args = parser.parse_args()
    input_file = open(args.input_file,
                      'rb') if args.input_file != '-' else sys.stdin.buffer
    output_file = open(args.output_file,
                       'wb') if args.output_file != '-' else sys.stdout.buffer
    action = decode if args.decrypt else encode
    output_file.write(
        action(bytes.fromhex(args.zip_password), input_file.read()))
