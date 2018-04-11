var ChainPoint = artifacts.require("./ChainPoint.sol");

contract('ChainPoint', function(accounts) {
  it("checkdate should be set after check", function() {
 
    var userid = "0F623638-9B01-4ca6-A553-72709801DB1C";
    var username = "scott"

    var instance = null;
    //var checkpointdate = 0;

    return ChainPoint.deployed().then(function(deployedcontract) {
      instance = deployedcontract;
      return instance.check(userid, username, 1);
    }).then(function() {
      return instance.getCheckDate(userid);
    }).then(function(checkpointdate) {
        assert.notEqual(checkpointdate, 0, "value of checkpointdate should not be null");
      })
  }).timeout(40000); 
});
