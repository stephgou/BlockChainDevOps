var ChainPoint = artifacts.require("./ChainPoint.sol");

contract('ChainPoint', (accounts) => {
  it('checkdate should be set after check', async () => {
    
    const instance = await ChainPoint.deployed()

    var userid = "0F623638-9B01-4ca6-A553-72709801DB1C";
    var username = "scott"

    await instance.check(userid, username, 1);

    const checkpointdate = await instance.getCheckDate(userid);

    assert.notEqual(checkpointdate, 0, "value of checkpointdate should not be null");
  })
})
