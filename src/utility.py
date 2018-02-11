#!/usr/bin/env python3
import argparse
import os
import sys

from src.crypto import SECRET_LEN, USERNAME_LEN, gen_user_password, encode, \
    decode


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
