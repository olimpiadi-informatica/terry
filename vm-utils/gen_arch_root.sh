#!/bin/bash -e

[ -z "$2" ] && echo "Usage: $0 output_folder password"
[ -z "$2" ] && exit 1

OUTDIR=$1
PASSWORD=$2

mkdir -p $OUTDIR
ls -A $OUTDIR/ | grep . > /dev/null && echo "Output directory is not empty!"
ls -A $OUTDIR/ | grep . > /dev/null && exit 2

TMP=$(mktemp -d)

cleanup() {
  rm -rf ${TMP}
}

trap cleanup EXIT

cat > ${TMP}/mirrorlist << EOF
Server = http://arch32.mirrors.simplysam.us/\$arch/\$repo
Server = http://archlinux32.vollzornbrot.de/\$arch/\$repo
Server = https://archlinux32.vollzornbrot.de/\$arch/\$repo
Server = http://mirror.archlinux32.org/\$arch/\$repo
Server = https://mirror.archlinux32.org/\$arch/\$repo
Server = https://ind.mirror.archlinux32.org/\$arch/\$repo
Server = https://jpn.mirror.archlinux32.org/\$arch/\$repo
Server = https://mex.mirror.archlinux32.org/\$arch/\$repo
Server = https://sgp.mirror.archlinux32.org/\$arch/\$repo
Server = https://32.arlm.tyzoid.com/\$arch/\$repo
Server = https://mirror.math.princeton.edu/pub/archlinux32/\$arch/\$repo
EOF

cat > ${TMP}/pacman.conf << EOF
[options]
Architecture = i686
Color
SigLevel = Never

[core]
Include = ${TMP}/mirrorlist

[extra]
Include = ${TMP}/mirrorlist

[community]
Include = ${TMP}/mirrorlist
EOF

clean_chroot() {
  $(dirname $0)/unsetup_chroot.sh ${OUTDIR}
}

trap clean_chroot EXIT
$(dirname $0)/setup_chroot.sh ${OUTDIR}

mkdir -p ${OUTDIR}/var/lib/pacman/
linux32 pacman --config ${TMP}/pacman.conf -r ${OUTDIR} -Syu \
  base linux grub networkmanager openssh --noconfirm

# Time zone
ln -sf /usr/share/zoneinfo/Europe/Rome ${OUTDIR}/etc/localtime

# Locale
echo en_US.UTF-8 UTF-8 > ${OUTDIR}/etc/locale.gen
linux32 chroot ${OUTDIR} locale-gen
echo LANG=en_US.UTF-8 > ${OUTDIR}/etc/locale.conf

# Hostname
echo terry > ${OUTDIR}/etc/hostname
echo 127.0.0.1 terry.localdomain terry >> ${OUTDIR}/etc/hosts

# Root password
echo "root:$PASSWORD" | linux32 chroot ${OUTDIR} chpasswd

# Ramdisk
sed -i 's/^HOOKS=.*$/HOOKS="base udev block filesystems"/' ${OUTDIR}/etc/mkinitcpio.conf
linux32 chroot ${OUTDIR} mkinitcpio -p linux

# Grub config
sed -i 's/#GRUB_HIDDEN_TIMEOUT=.*/GRUB_HIDDEN_TIMEOUT=3/g' ${OUTDIR}/etc/default/grub
sed -i 's/GRUB_TIMEOUT=.*/GRUB_TIMEOUT=0/g' ${OUTDIR}/etc/default/grub

# Services
linux32 chroot ${OUTDIR} systemctl enable NetworkManager.service
linux32 chroot ${OUTDIR} systemctl enable sshd.service

# Cleanup pacman and config
cp ${TMP}/mirrorlist ${OUTDIR}/etc/pacman.d
sed s_${TMP}_/etc/pacman.d/_g ${TMP}/pacman.conf > ${OUTDIR}/etc/pacman.conf
linux32 chroot ${OUTDIR} pacman -Scc --noconfirm

# mtab
ln -sf /proc/self/mounts ${OUTDIR}/etc/mtab
