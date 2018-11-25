'use strict';

console.log('Test deployed contract without address and without truffle test');

var Web3 = require("web3");
var provider = new Web3.providers.HttpProvider("http://localhost:8545");
var web3 = new Web3(provider);
var balance = web3.eth.getBalance(web3.eth.accounts[0]);

console.log(balance);
var contract = require("truffle-contract");

//var MetaCoin2 = artifacts.require("./MetaCoin.sol");
//ReferenceError: artifacts is not defined
//Truffle injects a global artifacts.require function, a helper for finding the right compiled 
//contract artifacts within the test environment. The test then finds a deployed instance of 
//the contract via .deployed(). But artifacts is available only in truffle test
//so we need to use the json with the compiled adress of the migrated contract

var contractArtifact = require("../build/contracts/ChainPoint.json");

var myContract = contract(contractArtifact);

myContract.setProvider(provider);

myContract.defaults({from: account_one});

var contract = null;

myContract.deployed().then(instance => {

  contract = instance;

  // Make a transaction that calls the function `sendCoin`, sending 3 MetaCoin
  // to the account listed as account_two.

  var id = "0F623638-9B01-4ca6-A553-72709801DB1C";
  var username = "scott";
  var account_production = web3.eth.accounts[0];
  var step = 1;

  //var c = contract.check(id, username, step, {from: account_production, gas: 200000});
  //console.log("Transaction successful! " + String.fromCharCode.apply(String, c));
 
  contract.check(id, username, step, {from: account_production, gas: 200000}).then(function(calltx) {
      // This code block will not be executed until truffle-contract has verified
      // the transaction has been processed and it is included in a mined block.
      // truffle-contract will error if the transaction hasn't been processed in 120 seconds.
    console.log("Call Transaction successful! ");
    var logs = contract.CheckPointAchieved({fromBlock: 'latest'});
    logs.watch(function(error, result) {
      console.log("CheckPoint!");
      console.log(result.args.userid);
      console.log(result.args.username);
      console.log(result.args.step.toString());
    });
  }).catch(function(e) {
  // Transaction failed
  console.log("Transaction failed:");
  console.log("ERROR! " + e.message);
  console.dir(e);
  });
});