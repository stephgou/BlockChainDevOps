'use strict';

console.log('Hello world');

var Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
web3.eth.getBalance(web3.eth.accounts[0]);
web3.fromWei(web3.eth.getBalance(web3.eth.accounts[0]), 'ether');
var acct1 = web3.eth.accounts[0];
var acct2 = web3.eth.accounts[1];
var acct3 = web3.eth.accounts[2];

var balance = (acct) => {
    return web3.fromWei(web3.eth.getBalance(acct), 'ether').toNumber();
};

balance(acct1);
web3.eth.sendTransaction({
    from: acct1, to: acct2, value: web3.toWei(1, 'ether'),
    gasLimit: 21000, gasPrice: 20000000000
});

var txHash = "0xc509b59a389c01a139c3d10eaba5ca089bc5587ed23efcb61f726ff441b3c169";

balance(acct2);
balance(acct1);

var txInfo = web3.eth.getTransaction(txHash);

console.log(txInfo);

process.stdin.on('char', function () {
    var chunk = process.stdin.read();
    if (chunk !== null) {
        process.stdout.write('data: ' + chunk + 'got?\n');
    }
});