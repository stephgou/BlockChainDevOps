#!/bin/bash

function usage()
{
    echo "INFO:"
    echo "Usage:...."
}

function error_log()
{
    if [ "$?" != "0" ]; then
        log "$1"
        log "Deployment ends with an error" "1"
        exit 1
    fi
}

function log()
{
  mess="$(hostname): $1"
  logger -t "${BASH_SCRIPT}" "${mess}"
}

function install_prerequisites()
{
    log "Update System ..."
    until apt-get --yes update
    do
      log "Lock detected on apt-get while install Try again..."
      sleep 2
    done

    log "Install software-properties-common ..."
	until apt-get --yes install software-properties-common build-essential libssl-dev libffi-dev python-dev > /dev/null 2>&1
    do
      log "Lock detected on apt-get while install Try again..."
      sleep 2
    done

    log "Update System ..."
    until apt-get --yes update
    do
      log "Lock detected on apt-get while install Try again..."
      sleep 2
    done

    log "Install git ..."
    until apt-get --yes install git > /dev/null 2>&1
    do
      log "Lock detected on apt-get while install Try again..."
      sleep 2
    done

	log "Update System ..."
    until apt-get --yes update
    do
      log "Lock detected on apt-get while install Try again..."
      sleep 2
    done

	log "Install npm ..."
    until apt-get --yes install npm > /dev/null 2>&1
    do
      log "Lock detected on apt-get while install Try again..."
      sleep 2
    done

    log "Install node ..."
    until curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - > /dev/null 2>&1
    do
      log "Lock detected on curl while install Try again..."
      sleep 2
    done

    until sudo apt-get install -y nodejs > /dev/null 2>&1
    do
      log "Lock detected on apt-get install -y nodejs while install Try again..."
      sleep 2
    done


	#log "Install azure-cli ..."
	#npm install azure-cli -g > /dev/null 2>&1
	#update-alternatives --install /usr/bin/node nodejs /usr/bin/nodejs 100

}


# print commands and arguments as they are executed
set -x

echo "initializing geth installation"
usage
date
ps axjf

CWD="$(cd -P -- "$(dirname -- "$0")" && pwd -P)"

log "CustomScript Directory is ${CWD}" "N"

#############
# Parameters
#############

BASH_SCRIPT="${0}"
AZURE_USER="${1}"
ETHEREUM_ACCOUNT_PWD="${2}"
ETHEREUM_ACCOUNT_KEY="${3}"
ETHEREUM_NETWORK_ID="${4}"
ETHEREUM_ACCOUNT_ADDRESS="${5}"
ETHEREUM_MINING_NODES_NUMBER="${6}"
ETHEREUM_NODE_IDENTITY="${7}"
ETHEREUM_NODE_NUMBER="${8}"
ETHEREUM_NODE_IP="${9}"

HOMEDIR="/home/$AZURE_USER"
VMNAME=`hostname`
ETHEREUM_ACCOUNT_PWD_FILE="$HOMEDIR/ethereum-account-pwd-file"
ETHEREUM_ACCOUNT_KEY_FILE="$HOMEDIR/ethereum-account-key-file"
ETHEREUM_ENODE_FILE="$HOMEDIR/ethereum-enode-file"
GETH_LOG_FILE_PATH="$HOMEDIR/blockchain.log"
GETH_START_SCRIPT="$HOMEDIR/start-private-blockchain.sh"
BLOCKCHAIN_DIR="chains/hackademy"
ETHEREUM_STATS_FILE="configure-ethstats.sh"
ETHEREUM_NETSTATS_DIR="eth-netstats"
ETHEREUM_NETINTELLIGENCE_DIR="eth-net-intelligence-api"

echo "User: $AZURE_USER"
echo "User home dir: $HOMEDIR"
echo "vmname: $VMNAME"
echo "ETHEREUM_ACCOUNT_PWD: $ETHEREUM_ACCOUNT_PWD"
echo "ETHEREUM_ACCOUNT_KEY: $ETHEREUM_ACCOUNT_PWD_FILE"
echo "ETHEREUM_NETWORK_ID: $ETHEREUM_NETWORK_ID"
echo "ETHEREUM_ACCOUNT_PWD_FILE: $ETHEREUM_ACCOUNT_PWD_FILE"
echo "ETHEREUM_ACCOUNT_KEY_FILE: $ETHEREUM_ACCOUNT_KEY_FILE"
echo "GETH_LOG_FILE_PATH: $GETH_LOG_FILE_PATH"
echo "ETHEREUM_MINING_NODES_NUMBER: $ETHEREUM_MINING_NODES_NUMBER"
echo "ETHEREUM_NODE_IDENTITY: $ETHEREUM_NODE_IDENTITY"
echo "ETHEREUM_NODE_NUMBER: $ETHEREUM_NODE_NUMBER"
echo "ETHEREUM_NODE_IP: $ETHEREUM_NODE_IP"

cd $HOMEDIR

install_prerequisites


####################
# Setup Geth
####################
add-apt-repository -y ppa:ethereum/ethereum
apt-get update
apt-get install -y ethereum  > /dev/null 2>&1

####################
# Install sol compiler
####################
add-apt-repository ppa:ethereum/ethereum -y
apt-get update
apt-get install solc -y  > /dev/null 2>&1


# Fetch Genesis and Private Key
wget https://raw.githubusercontent.com/stephgou/BlockchainDevOps/master/EthereumEnv/Cloud/BlockChainPoint/Genesis/genesis.json
wget https://raw.githubusercontent.com/stephgou/BlockchainDevOps/master/EthereumEnv/Cloud/BlockChainPoint/Scripts/start-private-blockchain.sh
wget https://raw.githubusercontent.com/stephgou/BlockchainDevOps/master/EthereumEnv/Cloud/BlockChainPoint/Scripts/configure-ethstats.sh

date

# configuration
printf "${ETHEREUM_ACCOUNT_KEY}" >> "${ETHEREUM_ACCOUNT_KEY_FILE}"
printf "${ETHEREUM_ACCOUNT_PWD}" >> "${ETHEREUM_ACCOUNT_PWD_FILE}"

UPDATE_GENESIS="sed -i -e s/ETHEREUM_NETWORK_ID/${ETHEREUM_NETWORK_ID}/g -e s/ETHEREUM_ACCOUNT_ADDRESS/${ETHEREUM_ACCOUNT_ADDRESS}/g genesis.json"
$(${UPDATE_GENESIS})

echo "===== Genesis Intialization =====";
rm -rf {$BLOCKCHAIN_DIR}/geth/chaindata
geth --datadir "${BLOCKCHAIN_DIR}" init genesis.json
echo "completed geth install $$"

echo "===== Prefunded Ethereum Account import =====";
geth --password "${ETHEREUM_ACCOUNT_PWD_FILE}" --datadir "${BLOCKCHAIN_DIR}" account import "${ETHEREUM_ACCOUNT_KEY_FILE}" 
#geth --password "${ETHEREUM_ACCOUNT_PWD_FILE}" account import "${ETHEREUM_ACCOUNT_KEY_FILE}" 

#start blockchain
#resync node clock
#an accurate clock is required to participate in the Ethereum network
ntpdate -s time.nist.gov

#sh "$GETH_START_SCRIPT" "$ETHEREUM_NETWORK_ID" </dev/null >"$GETH_LOG_FILE_PATH" 2>&1 &
if [ "${ETHEREUM_MINING_NODES_NUMBER}" = 1 ] ; then
	bash "${GETH_START_SCRIPT}" "${ETHEREUM_NETWORK_ID}" "${BLOCKCHAIN_DIR}" "${ETHEREUM_ACCOUNT_ADDRESS}" "${ETHEREUM_ACCOUNT_PWD_FILE}"  "${ETHEREUM_NODE_IDENTITY}"  "${ETHEREUM_NODE_IP}" true </dev/null 2>&1 &
else
	bash "${GETH_START_SCRIPT}" "${ETHEREUM_NETWORK_ID}" "${BLOCKCHAIN_DIR}" "${ETHEREUM_ACCOUNT_ADDRESS}" "${ETHEREUM_ACCOUNT_PWD_FILE}"  "${ETHEREUM_NODE_IDENTITY}"  "${ETHEREUM_NODE_IP}" false </dev/null 2>&1 &
fi

echo "===== Started geth node =====";

if [ $ETHEREUM_NODE_NUMBER -eq 0 ]; then

	git clone https://github.com/cubedro/eth-netstats
	cd "$ETHEREUM_NETSTATS_DIR"
	npm install > /dev/null 2>&1
	npm install -g grunt-cli > /dev/null 2>&1
	grunt all > /dev/null 2>&1
	#WS_SECRET="eth-net-stats-has-a-secret" npm start
	cd ..

	#https://ethereum.gitbooks.io/frontier-guide/content/netstats.html
	git clone https://github.com/cubedro/eth-net-intelligence-api
	cp "$HOMEDIR/$ETHEREUM_STATS_FILE" "$HOMEDIR/$ETHEREUM_NETINTELLIGENCE_DIR/$ETHEREUM_STATS_FILE" 
	cd "$ETHEREUM_NETINTELLIGENCE_DIR"
	npm install > /dev/null 2>&1
	npm install -g pm2 > /dev/null 2>&1

	#https://github.com/ethereum/go-ethereum/wiki/Setting-up-monitoring-on-local-cluster
	#git clone https://github.com/ethersphere/eth-utils.git

	len_vm_name=${#VMNAME}
	len_minus_2=$((len_vm_name-2))
	name_prefix="${VMNAME:0:$len_minus_2}"

	bash "./../$ETHEREUM_STATS_FILE" "$ETHEREUM_MINING_NODES_NUMBER" "$name_prefix" "http://localhost:3000" "eth-net-stats-has-a-secret" > app.json

	cd ..
	#after udpate of the app.json
	#pm2 start app.json

fi

GETH_IPC="/home/$AZURE_USER/$BLOCKCHAIN_DIR/geth.ipc"

log "Gething Ethereum enode ..."

while [ ! -S "$GETH_IPC" ]
do
  log "$GETH_IPC file not found Try again..."
  sleep 2
done

ENODE=`geth --exec "admin.nodeInfo" attach ipc:$BLOCKCHAIN_DIR/geth.ipc |grep "enode:"|sed -r 's:.*"([^"]+)".*:\1:'`
IP_ADDR=`ifconfig|grep "inet addr"|grep -v "127.0.0.1"|sed -r 's:[^0-9.]*([0-9.]+).*:\1:'`
SED_ARG="-r 's/\[::\]/${IP_ADDR}/'"
ENODE=`echo $ENODE|eval sed "$SED_ARG"`

printf "%s\n" "$ENODE" >> "${ETHEREUM_ENODE_FILE}"
