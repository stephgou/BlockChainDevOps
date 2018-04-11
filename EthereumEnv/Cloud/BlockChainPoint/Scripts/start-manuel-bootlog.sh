#!/bin/bash
HOMEDIR="/home/hackademy"
ETHEREUM_ACCOUNT_PWD_FILE="$HOMEDIR/ethereum-account-pwd-file"
ETHEREUM_ACCOUNT_KEY_FILE="$HOMEDIR/ethereum-account-key-file"
GETH_LOG_FILE_PATH="$HOMEDIR/blockchain.log"
GETH_START_SCRIPT="$HOMEDIR/start-private-blockchain.sh"
BLOCKCHAIN_DIR="chains/hackademy"
ETHEREUM_NETWORK_ID=180666
ETHEREUM_ACCOUNT_ADDRESS="0xd5e6350e57c075cf756daa4bf16e6bd7190dd0b2"
#ETHEREUM_ENODE_URL="enode://d01e6e3fa4c3851d70112718352918d6cad22c22e620d7416982935ac639f6a59e570b665a0e4ce5d85b4f5bbcfbc7fd22117493aa4edf51a30ca43325b2ee90@52.178.203.224:30303"
ETHEREUM_ENODE_URL="enode://d01e6e3fa4c3851d70112718352918d6cad22c22e620d7416982935ac639f6a59e570b665a0e4ce5d85b4f5bbcfbc7fd22117493aa4edf51a30ca43325b2ee90@10.0.0.4:30303"
geth --maxpeers 10 --rpc --rpcaddr "0.0.0.0" --rpcport "8545" --rpccorsdomain "*" --ipcapi "admin,db,eth,debug,miner,net,shh,txpool,personal,web3" --rpcapi "db,eth,net,web3" --networkid "${ETHEREUM_NETWORK_ID}" --unlock "${ETHEREUM_ACCOUNT_ADDRESS}" --password "${ETHEREUM_ACCOUNT_PWD_FILE}" --bootnodes "${ETHEREUM_ENODE_URL}"


geth --maxpeers 10 --rpc --rpcaddr 0.0.0.0 --rpcport 8545 --rpccorsdomain * --ipcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3 --rpcapi db,eth,net,web3 --networkid 180666 --unlock 0xd5e6350e57c075cf756daa4bf16e6bd7190dd0b2 --password /home/hackademy/ethereum-account-pwd-file --bootnodes enode://d01e6e3fa4c3851d70112718352918d6cad22c22e620d7416982935ac639f6a59e570b665a0e4ce5d85b4f5bbcfbc7fd22117493aa4edf51a30ca43325b2ee90@10.0.0.4:30303 --nodiscover

geth --maxpeers 10 --rpc --rpcaddr 0.0.0.0 --rpcport 8545 --rpccorsdomain * --ipcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3 --rpcapi db,eth,net,web3 --networkid 180666 --unlock 0xd5e6350e57c075cf756daa4bf16e6bd7190dd0b2 --password /home/hackademy/ethereum-account-pwd-file --nodiscover console