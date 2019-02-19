#!/usr/bin/env xonsh

import argparse
import os
from tempfile import TemporaryDirectory, NamedTemporaryFile
import sys

IMAGE_TYPE = ["vdi", "vmdk", "vhd", "raw", "ovf"]
DEFAULT_IMAGE_SIZE = 16 << 10
DEFAULT_MEMORY_SIZE = 2 << 10

def check_root():
    if int($(id -u)) != 0:
        print("Run this script as root", file=sys.stderr)
        sys.exit(1)

def get_args():
    parser = argparse.ArgumentParser(description="Generate an image from a rootfs")
    parser.add_argument("-r", "--rootfs", help="Path to rootfs directory", type=str, required=True)
    parser.add_argument("-s", "--size", help="Size for the generated image (MiB)", type=int, default=DEFAULT_IMAGE_SIZE)
    parser.add_argument("-o", "--output-file", help="Output filename", type=str, required=True)
    parser.add_argument("-t", "--image-type", help="Image type", type=str, choices=IMAGE_TYPE, required=True)
    parser.add_argument("-u", "--chown-user", help="Change ownership of the output to this user", type=str, default="root")
    parser.add_argument("-n", "--name", help="Virtual Machine image name", type=str, default="default")
    parser.add_argument("-m", "--memory", help="Virtual Machine memory (MiB)", type=int, default=DEFAULT_MEMORY_SIZE)
    parser.add_argument("-p", "--port-forwarding", help="Virtual Machine port forwarding (format -> protocol:port_host:port_guest) (example: tcp:2222:22)", type=str, default=[], nargs='+')
    return parser.parse_args()

if __name__ == "__main__":
    base_path = $(dirname @(sys.argv[0])).strip()
    args = get_args()
    check_root()
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
    @(base_path + "/do_chroot.sh") @(mount_point.name) grub-install --target=i386-pc --boot-directory=/boot/ @(loopback)
    @(base_path + "/do_chroot.sh") @(mount_point.name) grub-mkconfig -o /boot/grub/grub.cfg
    umount @(loopback_partition)
    mount_point.cleanup()
    losetup -d @(loopback)
    rm -f @(args.output_file)
    if args.image_type == "raw":
        cp @(raw_image.name) @(args.output_file)
    elif args.image_type == "ovf":
        ivm = NamedTemporaryFile()
        ivmc = TemporaryDirectory()
        vboxmanage convertfromraw @(raw_image.name) @(ivm.name + ".vmdk") --format VMDK --variant Standard
        vboxmanage createvm --ostype Linux --basefolder @(ivmc.name) --name @(args.name) --register
        vboxmanage modifyvm @(args.name) --memory @(args.memory)
        VBoxManage modifyvm @(args.name) --nataliasmode1 proxyonly
        for i, port in enumerate(args.port_forwarding):
            protocol, port_host, port_guest = [x for x in port.split(":")]
            vboxmanage modifyvm @(args.name) --natpf1 @("%s,%s,,%s,,%s" % ("rule" + str(i + 1), protocol, port_host, port_guest))
        vboxmanage storagectl @(args.name) --name "SATA Controller" --add sata --controller IntelAHCI
        vboxmanage storageattach @(args.name) --storagectl "SATA Controller" --port 0 --device 0 --type hdd --medium @(ivm.name + ".vmdk")
        vboxmanage export @(args.name) --ovf20 -o @(args.output_file)
        vboxmanage unregistervm @(args.name) --delete
        ivm.close()
        ivmc.cleanup()
    else:
        vboxmanage convertfromraw @(raw_image.name) @(args.output_file) --format @(args.image_type.upper()) --variant Standard
    raw_image.close()
    chown @(args.chown_user + ":" + args.chown_user) @(args.output_file)
