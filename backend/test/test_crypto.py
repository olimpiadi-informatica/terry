#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2018 - Luca Versari <veluca93@gmail.com>
import base64
import unittest

from terry import crypto


class TestCrypto(unittest.TestCase):
    def test_user_to_bytes(self):
        username = "FOO_BAR01"
        res = crypto.user_to_bytes(username)
        self.assertEqual(username, res.decode("ascii"))

    def test_invalid_user_to_bytes(self):
        username = "foo!"
        with self.assertRaises(ValueError):
            crypto.user_to_bytes(username)

    def test_combine_username(self):
        username = "FOO"
        password = "BAR"
        self.assertEqual(
            crypto.combine_username_password(username, password), "FOO-BAR")

    def test_encode_data(self):
        username = "FOO"
        data = b"BARRR"
        assert (len(username) + len(data)) % 8 == 0
        encoded = crypto.encode_data(username, data)
        self.assertTrue(encoded.startswith(username + "-"))
        base32 = "".join(
            filter(lambda x: x != "-", encoded[len(username) + 1:]))
        self.assertEqual(data, base64.b32decode(base32))

    def test_encode_data_unaligned(self):
        username = "FOO"
        data = b"BARR"
        assert (len(username) + len(data)) % 8 != 0
        with self.assertRaises(ValueError):
            crypto.encode_data(username, data)

    def test_decode_data(self):
        base32 = "FOOOOOOOBARRRRRR"
        secret_len = len("FOOOOOOOO") * 5 // 8
        secret, password = crypto.decode_data(base32, secret_len)
        self.assertEqual(secret, base64.b32decode("FOOOOOOO"))
        self.assertEqual(password, base64.b32decode("BARRRRRR"))

    def test_encode_decode(self):
        password = b"fooobarr"
        data = b"#bellavita"
        encrypted = crypto.encode(password, data, b"")
        self.assertEqual(data, crypto.decode(password, encrypted))

    def test_encode_metadata_too_long(self):
        password = b"fooobarr"
        data = b"#bellavita"
        with self.assertRaises(ValueError):
            crypto.encode(password, data, b"A" * 1025)

    def test_gen_user_password(self):
        username = "FOOO"
        secret = b"SEC"
        file_password = b"PASSWOR"

        token = crypto.gen_user_password(username, secret, file_password)
        new_secret, encoded_password = crypto.decode_data(
            token[len(username) + 1:], len(secret))

        self.assertEqual(file_password,
                         crypto.recover_file_password(username, new_secret,
                                                      encoded_password))

    def test_gen_password_too_long(self):
        username = "FOOO"
        secret = b"FFF"
        file_password = b"A" * 67

        with self.assertRaises(ValueError):
            crypto.gen_user_password(username, secret, file_password)

    def test_gen_password_max_len(self):
        username = "FOOO"
        secret = b"FFF"
        file_password = b"A" * 62

        crypto.gen_user_password(username, secret, file_password)

    def test_gen_user_password_invalid_secret_len(self):
        username = "FOOO"
        secret = b"FFFFF"
        scrambled_password = b"A" * 5

        with self.assertRaises(ValueError):
            crypto.gen_user_password(username, secret, scrambled_password)

    def test_recover_file_password_too_long(self):
        username = "FOOO"
        secret = b"FFF"
        scrambled_password = b"A" * 65

        with self.assertRaises(ValueError) as e:
            crypto.recover_file_password(username, secret, scrambled_password)

    def test_recover_file_password_from_token(self):
        username = "FOOO"
        secret = b"FFF"
        file_password = b"A" * 7
        token = crypto.gen_user_password(username, secret, file_password)
        self.assertEqual(crypto.recover_file_password_from_token(token),
                         file_password)

    def test_validate(self):
        password = b"fooobarr"
        data = b"#bellavita"
        encrypted = crypto.encode(password, data, b"metadata")
        self.assertTrue(crypto.validate(encrypted))

    def test_validate_invalid(self):
        password = b"fooobarr"
        data = b"#bellavita"
        encrypted = crypto.encode(password, data, b"metadata")
        encrypted += b'('
        self.assertFalse(crypto.validate(encrypted))

    def test_metadata(self):
        password = b"fooobarr"
        data = b"#bellavita"
        encrypted = crypto.encode(password, data, b"metadata")
        metadata = crypto.metadata(encrypted)
        self.assertEqual(metadata.strip(b"\x00"), b"metadata")