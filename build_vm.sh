#!/bin/bash -e

[ -z "$5" ] && echo "Usage: $0 root_password target_file image_name disk_size_mb ram_size_mb"
[ -z "$5" ] && exit 1

TMP=$(mktemp -d)
ROOT_PASSWORD=$1
TARGET_FILE=$2
IMAGE_NAME=$3
DISK_SIZE_MB=$4
RAM_SIZE_MB=$5


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
$(dirname $0)/vm-utils/prepare_terry_arch.sh ${TMP}
$(dirname $0)/vm-utils/gen_image.sh -r ${TMP} -o ${TARGET_FILE} -t ovf \
  -m ${RAM_SIZE_MB} -n "${IMAGE_NAME}" -s ${DISK_SIZE_MB} -u $USER -p tcp:9000:80
EOF
