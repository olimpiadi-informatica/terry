#!/usr/bin/env xonsh

import argparse
import os
from tempfile import TemporaryDirectory, NamedTemporaryFile
import sys

IMAGE_TYPE = ["vdi", "vmdk", "vhd", "raw"]
DEFAULT_IMAGE_SIZE = 16 << 10

def check_root():
    if int($(id -u)) != 0:
        print("Run this script as root", file=sys.stderr)
        sys.exit(1)

def get_args():
    parser = argparse.ArgumentParser(description="Generate an image from a rootfs")
    parser.add_argument("-r", "--rootfs", help="Path to rootfs directory", type=str, required=True)
    parser.add_argument("-s", "--size", help="Size for the generated image", type=int, default=DEFAULT_IMAGE_SIZE)
    parser.add_argument("-o", "--output-file", help="Output filename", type=str, required=True)
    parser.add_argument("-t", "--image-type", help="Image type", type=str, choices=IMAGE_TYPE, required=True)
    parser.add_argument("-u", "--chown-user", help="Change ownership of the output to this user", type=str, default="root")
    return parser.parse_args()

if __name__ == "__main__":
    check_root()
    args = get_args()
    raw_image = NamedTemporaryFile()
    truncate -s @(args.size << 20) @(raw_image.name)
    loopback = $(losetup -f).strip()
    losetup @(loopback) @(raw_image.name)
    parted -s @(loopback) mklabel msdos
    parted -s @(loopback) mkpart primary ext4 "3M" "100%"
    parted -s @(loopback) "set" "1" boot on
    loopback_partition = loopback + "p1"
    mkfs.ext4 @(loopback_partition)
    mount_point = TemporaryDirectory()
    mount @(loopback_partition) @(mount_point.name + "/")
    rsync -a @(args.rootfs + "/") @(mount_point.name + "/")
    echo "/dev/sda1 / ext4 rw,relatime,data=ordered 0 1" > @(mount_point.name + "/etc/fstab")
    grub-install --target=i386-pc @("--boot-directory=" + mount_point.name + "/boot/") @(loopback)
    ./do_chroot.sh @(mount_point.name) grub-mkconfig -o /boot/grub/grub.cfg
    umount @(loopback_partition)
    mount_point.cleanup()
    losetup -d @(loopback)
    if args.image_type == "raw":
        cp @(raw_image.name) @(args.output_file)
    else:
        print("UNIMPLEMENTED!", file=sys.stderr)
    raw_image.close()
    chown @(args.chown_user + ":" + args.chown_user) @(args.output_file)
