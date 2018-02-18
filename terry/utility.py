#!/usr/bin/env python3
import argparse
import os
import sys

from terry.crypto import SECRET_LEN, USERNAME_LEN, gen_user_password, encode, \
    decode, validate, metadata


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
    parser.add_argument('-m', '--metadata', help='metadata input file')
    parser.add_argument('zip_password', help='hexified zip password')
    parser.add_argument(
        'input_file', help='input file', nargs='?', default='-')
    parser.add_argument(
        'output_file', help='output file', nargs='?', default='-')
    args = parser.parse_args()
    input_file = open(args.input_file,
                      'rb') if args.input_file != '-' else sys.stdin.buffer
    metadata_file = open(args.metadata,
                         'rb') if args.metadata is not None else None
    output_file = open(args.output_file,
                       'wb') if args.output_file != '-' else sys.stdout.buffer
    zip_password = bytes.fromhex(args.zip_password)
    input_data = input_file.read()
    if args.decrypt:
        assert validate(input_data)
        output_file.write(decode(zip_password, input_data))
    else:
        metadata_in = metadata_file.read(
        ) if metadata_file is not None else b""
        output_file.write(encode(zip_password, input_data, metadata_in))


def get_metadata_main():
    parser = argparse.ArgumentParser(
        description='Validate and get a file metadata')
    parser.add_argument(
        'input_file', help='input file', nargs='?', default='-')
    parser.add_argument(
        'output_file', help='output file', nargs='?', default='-')
    args = parser.parse_args()
    input_file = open(args.input_file,
                      'rb') if args.input_file != '-' else sys.stdin.buffer
    output_file = open(args.output_file,
                       'wb') if args.output_file != '-' else sys.stdout.buffer
    input_data = input_file.read()
    assert validate(input_data)
    output_file.write(metadata(input_data).strip(b'\x00'))
