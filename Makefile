.NOTPARALLEL:
.SILENT:
SHELL := /bin/bash -x
TARGET=root
WORKDIR=temp
OVA_SIZE=10240 # in MiB
VM_NAME=Terry Server
VM_MEMORY=2048 # in MiB
VM_HOST_PORT=9000
REACT_APP_DETECT_INTERNET_TEST_ENDPOINT=http://gstatic.com/generate_204
EXTRA_PACKAGES=nginx cronie pypy{,3} python{,2}-pip python{,2}-sortedcontainers python-colorama python-gevent python-pyjwt python-yaml python-werkzeug python-requests python-pynacl python-cffi python{,2}-numpy zip htop vim gcc
RAW_DISK=$(WORKDIR)/disk.img
VMDK_DISK=$(WORKDIR)/disk.vmdk
EXTRA_FILES_HOST_PATH=extra_files
EXTRA_FILES_VM_PATH=/app/extra_files

build: check_root \
	$(TARGET)/proc \
	$(TARGET)/var/lib/pacman \
	$(TARGET)/etc/localtime \
	$(TARGET)/etc/locale.conf \
	$(TARGET)/etc/hostname \
	$(TARGET)/etc/shadow \
	$(TARGET)/boot/initramfs-linux.img \
	$(TARGET)/etc/default/grub \
	$(TARGET)/etc/mirrorlist \
	$(TARGET)/etc/mtab \
	$(TARGET)/etc/resolv.conf \
	$(TARGET)/usr/lib/python%/site-packages/python_pytun% \
	$(TARGET)/app/territoriali-frontend \
	$(TARGET)/app/territoriali-backend \
	$(TARGET)/app/config.yaml \
	$(TARGET)/etc/nginx/nginx.conf \
	$(TARGET)/etc/systemd/system/territoriali-backend.service \
	$(TARGET)/root/watchdog.py \
	$(TARGET)/etc/systemd/system/getty@tty1.service.d/override.conf \
	$(TARGET)/root/.ssh \
	$(TARGET)/etc/modules-load.d/tun.conf \
	$(TARGET)/etc/ssh/sshd_config \
	$(TARGET)/root/httptun \
	$(TARGET)/etc/systemd/system/httptun-client.service \
	$(TARGET)/version \
	$(TARGET)/$(EXTRA_FILES_VM_PATH) \
	systemd_units

check_root:
	[ $(shell whoami) == root ]

$(TARGET): $(WORKDIR)/pacman.conf
	mkdir -p $@

$(WORKDIR):
	mkdir -p $@

$(WORKDIR)/territoriali-frontend: territoriali-frontend $(WORKDIR)
	export REACT_APP_DETECT_INTERNET_TEST_ENDPOINT=$(REACT_APP_DETECT_INTERNET_TEST_ENDPOINT) && \
		cd territoriali-frontend && yarn && yarn build
	cp -r territoriali-frontend/build $(WORKDIR)/territoriali-frontend

$(WORKDIR)/territoriali-backend: territoriali-backend $(WORKDIR)
	cp -r territoriali-backend $(WORKDIR)/territoriali-backend

$(WORKDIR)/mirrorlist: $(WORKDIR)
	cp vm-utils/mirrorlist $(WORKDIR)/mirrorlist

$(WORKDIR)/pacman.conf: $(WORKDIR) $(WORKDIR)/mirrorlist
	echo "[options]" > $@
	echo "Architecture = i686" >> $@
	echo "Color" >> $@
	echo "SigLevel = Never" >> $@
	echo "" >> $@
	echo "[core]" >> $@
	echo "Include = $(WORKDIR)/mirrorlist" >> $@
	echo "" >> $@
	echo "[extra]" >> $@
	echo "Include = $(WORKDIR)/mirrorlist" >> $@
	echo "" >> $@
	echo "[community]" >> $@
	echo "Include = $(WORKDIR)/mirrorlist" >> $@

$(WORKDIR)/config.yaml: $(WORKDIR) guard-CONFIG_YAML
	cp $(CONFIG_YAML) $@

$(WORKDIR)/nginx.conf: $(WORKDIR) guard-NGINX_CONF
	cp $(NGINX_CONF) $@

$(TARGET)/proc: $(TARGET)
	mountpoint -q $(TARGET)/sys || (mkdir -p $(TARGET)/sys && mount -t sysfs none $(TARGET)/sys)
	mountpoint -q $(TARGET)/tmp || (mkdir -p $(TARGET)/tmp && mount -t tmpfs none $(TARGET)/tmp)
	mountpoint -q $(TARGET)/dev || (mkdir -p $(TARGET)/dev && mount -t devtmpfs none $(TARGET)/dev)
	mountpoint -q $(TARGET)/dev/pts || mount -t devpts none $(TARGET)/dev/pts
	mountpoint -q $(TARGET)/proc || (mkdir -p $(TARGET)/proc && mount -t proc none $(TARGET)/proc)

$(TARGET)/var/lib/pacman: $(TARGET)/proc $(TARGET)
	mkdir -p $@
	linux32 pacman --config $(WORKDIR)/pacman.conf -r $(TARGET) -Syu \
		base linux grub networkmanager openssh $(EXTRA_PACKAGES) --noconfirm --needed

$(TARGET)/usr/lib/python%/site-packages/python_pytun%: $(TARGET)
	linux32 chroot $(TARGET) pip install python-pytun

$(TARGET)/etc/localtime: $(TARGET)
	ln -sf /usr/share/zoneinfo/Europe/Rome $(TARGET)/etc/localtime
	linux32 chroot $(TARGET) hwclock --systohc

$(TARGET)/etc/locale.conf: $(TARGET)
	echo en_US.UTF-8 UTF-8 > $(TARGET)/etc/locale.gen
	linux32 chroot $(TARGET) locale-gen
	echo LANG=en_US.UTF-8 > $(TARGET)/etc/locale.conf

$(TARGET)/etc/hostname: $(TARGET)
	echo "127.0.0.1 terry.localdomain terry" >> $(TARGET)/etc/hosts
	echo terry > $@

$(TARGET)/etc/shadow: $(TARGET) guard-ROOT_PASSWORD
	echo "root:$(ROOT_PASSWORD)" | linux32 chroot $(TARGET) chpasswd

$(TARGET)/boot/initramfs-linux.img: $(TARGET)
	sed -i 's/^HOOKS=.*$$/HOOKS="base udev block filesystems"/' $(TARGET)/etc/mkinitcpio.conf
	linux32 chroot $(TARGET) mkinitcpio -p linux

$(TARGET)/etc/default/grub: $(TARGET)
	sed -i 's/#GRUB_HIDDEN_TIMEOUT=.*/GRUB_HIDDEN_TIMEOUT=3/g' $(TARGET)/etc/default/grub
	sed -i 's/GRUB_TIMEOUT=.*/GRUB_TIMEOUT=0/g' $(TARGET)/etc/default/grub

$(TARGET)/etc/mirrorlist: $(TARGET)
	cp $(WORKDIR)/mirrorlist $(TARGET)/etc/mirrorlist

$(TARGET)/etc/mtab: $(TARGET)
	ln -sf /proc/self/mounts $(TARGET)/etc/mtab

$(TARGET)/etc/resolv.conf: $(TARGET)
	echo "nameserver 1.1.1.1" > $(TARGET)/etc/resolv.conf

$(TARGET)/app/territoriali-frontend: $(TARGET) $(WORKDIR)/territoriali-frontend
	mkdir -p $@
	cp -r $(WORKDIR)/territoriali-frontend $(TARGET)/app

$(TARGET)/app/territoriali-backend: $(TARGET) $(WORKDIR)/territoriali-backend
	mkdir -p $@
	cp -r $(WORKDIR)/territoriali-backend $(TARGET)/app
	linux32 chroot $(TARGET) bash -c "cd /app/territoriali-backend && python setup.py install"

$(TARGET)/app/config.yaml: $(TARGET) $(WORKDIR)/config.yaml
	cp $(WORKDIR)/config.yaml $(TARGET)/app/config.yaml

$(TARGET)/etc/nginx/nginx.conf: $(TARGET) $(WORKDIR)/nginx.conf
	cp $(WORKDIR)/nginx.conf $(TARGET)/etc/nginx/nginx.conf

$(TARGET)/etc/systemd/system/territoriali-backend.service: $(TARGET) vm-utils/territoriali-backend.service
	cp vm-utils/territoriali-backend.service $@

$(TARGET)/root/watchdog.py: $(TARGET) vm-utils/watchdog.py
	cp vm-utils/watchdog.py $@

$(TARGET)/etc/systemd/system/getty@tty1.service.d/override.conf: $(TARGET) vm-utils/override.conf
	mkdir -p $(TARGET)/etc/systemd/system/getty@tty1.service.d
	cp vm-utils/override.conf $@

$(TARGET)/root/.ssh: $(TARGET)
	mkdir -p $@
	yes | ssh-keygen -f $@/id_rsa -P "" -C "root@terry"
	-[ ! -z "$(ROOT_AUTHORIZED_KEYS)" ] && cp $(ROOT_AUTHORIZED_KEYS) $@/authorized_keys

$(TARGET)/etc/modules-load.d/tun.conf: $(TARGET)
	echo tun > $@

$(TARGET)/etc/ssh/sshd_config: $(TARGET)
	sed -i 's/.*PermitRootLogin.*$$/PermitRootLogin yes/g' $@

$(TARGET)/root/httptun: $(TARGET) vm-utils/httptun/client.py vm-utils/httptun/common.py
	mkdir -p $@
	cp vm-utils/httptun/client.py vm-utils/httptun/common.py $@

$(TARGET)/etc/systemd/system/httptun-client.service: $(TARGET) vm-utils/httptun-client.service guard-HTTPTUN_SERVER guard-HTTPTUN_PASSWORD
	cp vm-utils/httptun-client.service $@
	sed -i 's~HTTPTUN_SERVER_PLACEHOLDER~$(HTTPTUN_SERVER)~' $@
	sed -i 's~HTTPTUN_PASSWORD_PLACEHOLDER~$(HTTPTUN_PASSWORD)~' $@

$(TARGET)/version: $(TARGET) guard-VERSION
	echo $(VERSION) > $@

$(TARGET)/$(EXTRA_FILES_VM_PATH): $(TARGET) $(EXTRA_FILES_HOST_PATH)
	mkdir -p $@
	cp -Lr $(EXTRA_FILES_HOST_PATH)/* $@

systemd_units:
	linux32 chroot $(TARGET) systemctl enable NetworkManager.service
	linux32 chroot $(TARGET) systemctl enable sshd.service
	linux32 chroot $(TARGET) systemctl enable territoriali-backend.service
	linux32 chroot $(TARGET) systemctl enable httptun-client.service
	linux32 chroot $(TARGET) systemctl enable nginx.service
	linux32 chroot $(TARGET) systemctl enable cronie.service

unchroot:
	mountpoint -q $(TARGET)/sys && umount $(TARGET)/sys || true
	mountpoint -q $(TARGET)/tmp && umount $(TARGET)/tmp || true
	mountpoint -q $(TARGET)/dev/pts && umount $(TARGET)/dev/pts || true
	mountpoint -q $(TARGET)/dev && umount $(TARGET)/dev || true
	mountpoint -q $(TARGET)/proc && umount $(TARGET)/proc || true

$(RAW_DISK): $(TARGET) $(WORKDIR)
	linux32 chroot $(TARGET) pacman -Scc --noconfirm
	$(eval LOOPBACK := $(shell losetup -f))	
	# setup the disk image
	truncate -s $$(($(OVA_SIZE) * 1024 * 1024 )) $(RAW_DISK)
	losetup $(LOOPBACK) "$(RAW_DISK)"
	parted -s $(LOOPBACK) mklabel msdos
	parted -s $(LOOPBACK) mkpart primary ext4 3M 100%
	parted -s $(LOOPBACK) set 1 boot on
	mkfs.ext4 -FF $(LOOPBACK)p1
	mkdir -p $(WORKDIR)/image
	$(eval MOUNT_POINT := $(WORKDIR)/image)
	# copy all the files from the TARGET
	mount $(LOOPBACK)p1 $(MOUNT_POINT)
	rsync -a $(TARGET)/ $(MOUNT_POINT)/
	echo "/dev/sda1 / ext4 rw,relatime,data=ordered 0 1" > $(MOUNT_POINT)/etc/fstab
	# prepare a new chroot
	mkdir -p $(MOUNT_POINT)/sys && mount -t sysfs none $(MOUNT_POINT)/sys
	mkdir -p $(MOUNT_POINT)/tmp && mount -t tmpfs none $(MOUNT_POINT)/tmp
	mkdir -p $(MOUNT_POINT)/dev && mount -t devtmpfs none $(MOUNT_POINT)/dev
	mount -t devpts none $(MOUNT_POINT)/dev/pts
	mkdir -p $(MOUNT_POINT)/proc && mount -t proc none $(MOUNT_POINT)/proc
	# install grub
	linux32 chroot $(MOUNT_POINT) grub-install --target=i386-pc --boot-directory=/boot $(LOOPBACK)
	linux32 chroot $(MOUNT_POINT) grub-mkconfig -o /boot/grub/grub.cfg
	# umount the devs for the chroot
	umount $(MOUNT_POINT)/sys
	umount $(MOUNT_POINT)/tmp
	umount $(MOUNT_POINT)/dev/pts
	umount $(MOUNT_POINT)/dev
	umount $(MOUNT_POINT)/proc
	umount $(MOUNT_POINT)
	losetup -d $(LOOPBACK)

$(VMDK_DISK): $(RAW_DISK)
	mkdir -p $(WORKDIR)/vm_dir
	# the vmdk file must not exists
	rm -f $(VMDK_DISK)
	vboxmanage convertfromraw $(RAW_DISK) $(VMDK_DISK) --format VMDK --variant Standard
	vboxmanage createvm --ostype Linux --basefolder $(WORKDIR)/vm_dir --name "$(VM_NAME)" --register
	vboxmanage modifyvm "$(VM_NAME)" --memory $(VM_MEMORY)
	vboxmanage modifyvm "$(VM_NAME)" --nataliasmode1 proxyonly
	vboxmanage modifyvm "$(VM_NAME)" --natpf1 rule1,tcp,,$(VM_HOST_PORT),,80
	vboxmanage storagectl "$(VM_NAME)" --name "SATA Controller" --add sata --controller IntelAHCI
	vboxmanage storageattach "$(VM_NAME)" --storagectl "SATA Controller" --port 0 --device 0 --type hdd --medium $(VMDK_DISK)

%.ova: check_root unchroot $(TARGET) $(WORKDIR) $(VMDK_DISK)
	# the ova file must not exist
	rm -f $@
	vboxmanage export "$(VM_NAME)" --ovf20 -o "$@"
	vboxmanage unregistervm "$(VM_NAME)" --delete
	chmod 644 $@

clean: check_root unchroot
	sudo rm -rf $(TARGET) $(WORKDIR)

guard-%:
	@ if [ "${${*}}" = "" ]; then \
	    echo "Environment variable $* not set"; \
	    exit 1; \
	fi
