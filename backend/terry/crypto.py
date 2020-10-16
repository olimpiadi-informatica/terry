#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2018 - Luca Versari <veluca93@gmail.com>

from typing import BinaryIO
import base64
import abc

import nacl
import nacl.hash
import nacl.pwhash
import nacl.secret

NACL_SALT = bytes.fromhex(
    "5b6a78a780ea0ee560442cf5a528f0fb743d79e45a3a33af68671eba9cde0e17"
)
SECRET_LEN = 3
USERNAME_LEN = 6


class PackVersion(abc.ABC):
    hash_len = 32
    version_len = 1

    def __init__(self, input_data: bytes):
        self.input_data = input_data

    @staticmethod
    def version(input_data: bytes) -> int:
        """
        Return the version of the pack. The decoder can be found in the
        `pack_versions` list.
        """
        version = input_data[
            PackVersion.hash_len : PackVersion.hash_len + PackVersion.version_len
        ]
        return int.from_bytes(version, "little")

    def validate(self) -> bool:
        """
        Verify if the pack content is valid according to the hash stored
        inside.
        """
        sha = self.input_data[: self.hash_len]
        return sha == _sha256(self.input_data[self.hash_len :])

    @classmethod
    @abc.abstractmethod
    def encode(cls, password: bytes, input_data: bytes, metadata: bytes) -> bytes:
        """
        Encode the input_data and the metadata in a new pack encrypted with the
        provided password.
        """
        pass

    @classmethod
    @abc.abstractmethod
    def read_metadata(cls, file: BinaryIO) -> bytes:
        """
        Read just the metadata part from the pack. The file start from the
        first byte after the version.
        """
        pass

    @abc.abstractmethod
    def metadata(self) -> bytes:
        """
        Extract the plain text metadata from the pack.
        """
        pass

    @abc.abstractmethod
    def decode(self, password: bytes) -> bytes:
        """
        Decode the pack content using the provided password.
        """
        pass


class Version0(PackVersion):
    """
    Pack layout:
    - [  32 byte] SHA256 of version+metadata+encrypted
    - [   1 byte] version = 0
    - [1024 byte] metadata right-padded with zeros
    - [     rest] encrypted data
    """

    metadata_len = 1024

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    @classmethod
    def encode(cls, password: bytes, input_data: bytes, metadata: bytes) -> bytes:
        key = password_to_key(password)
        box = nacl.secret.SecretBox(key)
        encrypted = box.encrypt(input_data)
        if len(metadata) > Version0.metadata_len:
            raise ValueError("Metadata is too long")
        metadata += b"\x00" * (Version0.metadata_len - len(metadata))
        sha = _sha256(b"\x00" + metadata + encrypted)
        return sha + b"\x00" + metadata + encrypted

    @classmethod
    def read_metadata(cls, file: BinaryIO) -> bytes:
        return file.read(cls.metadata_len)

    def metadata(self) -> bytes:
        metadata_start = self.hash_len + self.version_len
        return self.input_data[metadata_start : metadata_start + self.metadata_len]

    def decode(self, password: bytes) -> bytes:
        key = password_to_key(password)
        box = nacl.secret.SecretBox(key)
        data_offset = self.hash_len + self.version_len + self.metadata_len
        return box.decrypt(self.input_data[data_offset:])


class Version1(PackVersion):
    """
    Pack layout:
    - [ 32 byte] SHA256 of version+metadata_len+metadata+encrypted
    - [  1 byte] version = 1
    - [  4 byte] metadata length, in big-endian
    - [variable] metadata content (of the declared length)
    - [    rest] encrypted data
    """

    metadata_len_len = 4

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    @classmethod
    def encode(cls, password: bytes, input_data: bytes, metadata: bytes) -> bytes:
        key = password_to_key(password)
        box = nacl.secret.SecretBox(key)
        encrypted = box.encrypt(input_data)
        metadata = len(metadata).to_bytes(cls.metadata_len_len, "big") + metadata
        sha = _sha256(b"\x01" + metadata + encrypted)
        return sha + b"\x01" + metadata + encrypted

    @classmethod
    def read_metadata(cls, file: BinaryIO) -> bytes:
        metadata_len = int.from_bytes(file.read(cls.metadata_len_len), "big")
        return file.read(metadata_len)

    def metadata_len(self) -> int:
        metadata_len_start = self.hash_len + self.version_len
        return int.from_bytes(
            self.input_data[
                metadata_len_start : metadata_len_start + self.metadata_len_len
            ],
            "big",
        )

    def metadata(self) -> bytes:
        metadata_start = self.hash_len + self.version_len + self.metadata_len_len
        return self.input_data[metadata_start : metadata_start + self.metadata_len()]

    def decode(self, password: bytes) -> bytes:
        key = password_to_key(password)
        box = nacl.secret.SecretBox(key)
        data_offset = (
            self.hash_len
            + self.version_len
            + self.metadata_len_len
            + self.metadata_len()
        )
        return box.decrypt(self.input_data[data_offset:])


pack_versions = [Version0, Version1]


def parse_pack(input_data: bytes) -> PackVersion:
    """
    Return the parser for the pack.
    """
    version = PackVersion.version(input_data)
    if version < 0 or version >= len(pack_versions):
        raise ValueError("Unsupported pack version: %d" % version)
    return pack_versions[version](input_data)


def _sha256(data: bytes) -> bytes:
    return bytes.fromhex(nacl.hash.sha256(data).decode())


def _sha512(data: bytes) -> bytes:
    return bytes.fromhex(nacl.hash.sha512(data).decode())


def user_to_bytes(user: str) -> bytes:
    """
    Convert a username into bytes, checking the format.
    """
    if not all("A" <= x <= "Z" or "0" <= x <= "9" or x == "_" for x in user):
        raise ValueError("Invalid username")
    return user.encode("ascii")


def combine_username_password(username: str, password: str):
    return username + "-" + password


def encode_data(user: str, data: bytes):
    b32data = base64.b32encode(data)
    if b32data[-1] == ord("="):
        raise ValueError(
            "Invalid secret + password length: %s" % b32data.decode("ascii")
        )
    return combine_username_password(
        user,
        "-".join(b32data[i : i + 4].decode("ascii") for i in range(0, len(b32data), 4)),
    )


def decode_data(b32data: str, secret_len: int):
    filtered_data = "".join(filter(lambda x: x != "-", b32data))
    data = base64.b32decode(filtered_data.encode("ascii"))
    return (data[:secret_len], data[secret_len:])


def gen_user_password(user: str, secret: bytes, file_password: bytes):
    if len(secret) != SECRET_LEN:
        raise ValueError(
            "The len of the secret is wrong (%d should be %d)"
            % (len(secret), SECRET_LEN)
        )
    digest = _sha512(user_to_bytes(user) + secret)
    if len(file_password) > len(digest):
        raise ValueError("File password is too long")
    scrambled_password = bytes([v ^ digest[i] for i, v in enumerate(file_password)])
    return encode_data(user, secret + scrambled_password)


def recover_file_password(user: str, secret: bytes, scrambled_password: bytes):
    digest = _sha512(user_to_bytes(user) + secret)
    if len(scrambled_password) > len(digest):
        raise ValueError("Scrambled password is too long")
    file_password = bytes([v ^ digest[i] for i, v in enumerate(scrambled_password)])
    return file_password


def recover_file_password_from_token(token):
    username, password = token.split("-", 1)
    secret, scrambled_password = decode_data(password, SECRET_LEN)
    return recover_file_password(username, secret, scrambled_password)


def password_to_key(password: bytes):
    ops = nacl.pwhash.scrypt.OPSLIMIT_MODERATE
    mem = nacl.pwhash.scrypt.MEMLIMIT_MODERATE
    length = nacl.secret.SecretBox.KEY_SIZE
    return nacl.pwhash.scrypt.kdf(
        length, password, NACL_SALT, opslimit=ops, memlimit=mem
    )


def encode(
    password: bytes, input_data: bytes, metadata: bytes, version: int = -1
) -> bytes:
    try:
        version = pack_versions[version]
    except IndexError:
        raise ValueError("Unsupported pack version: %d" % version)
    return version.encode(password, input_data, metadata)


def validate(input_data: bytes) -> bool:
    pack = parse_pack(input_data)
    return pack.validate()


def metadata(input_data: bytes) -> bytes:
    pack = parse_pack(input_data)
    return pack.metadata()


def read_metadata(path: str) -> bytes:
    with open(path, "rb") as f:
        f.read(PackVersion.hash_len)
        version = int.from_bytes(f.read(PackVersion.version_len), "big")
        try:
            version = pack_versions[version]
        except IndexError:
            raise ValueError("Unsupported pack version: %d" % version)
        return version.read_metadata(f)


def decode(password: bytes, input_data: bytes) -> bytes:
    pack = parse_pack(input_data)
    return pack.decode(password)
