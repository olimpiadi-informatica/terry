#!/bin/bash -ex

[ -z "$6" ] && echo "Usage: $0 root_password version target_file image_name disk_size_mb ram_size_mb nginx.conf config.yaml httptun_password [root_authorized_keys]"
[ -z "$6" ] && exit 1

HERE="$( cd "$(dirname "$0")" ; pwd -P )"

TMP=$(mktemp -d)
ROOT_PASSWORD=$1
VERSION=$2
TARGET_FILE=$3
IMAGE_NAME=$4
DISK_SIZE_MB=$5
RAM_SIZE_MB=$6
NGINX_PATH=$7
CONFIG_PATH=$8
HTTPTUN_PASSWORD=$9
ROOT_AUTHORIZED_KEYS=${10}

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

pushd "$HERE/territoriali-frontend"
yarn
yarn build
popd

sudo bash -e <<EOF
chmod o+rx ${TMP}
$HERE/vm-utils/gen_arch_root.sh ${TMP} ${ROOT_PASSWORD}
$HERE/vm-utils/prepare_terry_arch.sh ${TMP} ${VERSION} ${NGINX_PATH} ${CONFIG_PATH} ${HTTPTUN_PASSWORD} ${ROOT_AUTHORIZED_KEYS}
$HERE/vm-utils/gen_image.sh -r ${TMP} -o ${TARGET_FILE} -t ovf \
  -m "${RAM_SIZE_MB}" -n "${IMAGE_NAME}" -s ${DISK_SIZE_MB} -u $USER -p tcp:9000:80
EOF
