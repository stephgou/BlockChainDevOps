var Helpers = artifacts.require("./Helpers.sol");
var ChainPoint = artifacts.require("./ChainPoint.sol");

module.exports = function(deployer) {
  deployer.deploy(Helpers);
  deployer.link(Helpers, ChainPoint);
  deployer.deploy(ChainPoint);
};
