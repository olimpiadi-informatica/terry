#!/bin/bash -ex

[ -z "$6" ] && echo "Usage: $0 root_password version target_file image_name disk_size_mb ram_size_mb [root_authorized_keys]"
[ -z "$6" ] && exit 1

TMP=$(mktemp -d)
ROOT_PASSWORD=$1
VERSION=$2
TARGET_FILE=$3
IMAGE_NAME=$4
DISK_SIZE_MB=$5
RAM_SIZE_MB=$6
ROOT_AUTHORIZED_KEYS=$7

if [ ${TARGET_FILE: -4} != '.ova' ]
then
  echo "Invalid target file - should end with .ova"
  exit 2
fi

cleanup() {
  sudo rm -rf ${TMP}
}

trap cleanup EXIT

USER=$(whoami)

pushd territoriali-frontend
yarn
yarn build
popd

sudo bash -e <<EOF
chmod o+rx ${TMP}
$(dirname $0)/vm-utils/gen_arch_root.sh ${TMP} ${ROOT_PASSWORD}
$(dirname $0)/vm-utils/prepare_terry_arch.sh ${TMP} ${VERSION} ${ROOT_AUTHORIZED_KEYS}
$(dirname $0)/vm-utils/gen_image.sh -r ${TMP} -o ${TARGET_FILE} -t ovf \
  -m ${RAM_SIZE_MB} -n "${IMAGE_NAME}" -s ${DISK_SIZE_MB} -u $USER -p tcp:9000:80
EOF
