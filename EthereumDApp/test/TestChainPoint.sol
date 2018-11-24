pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/ChainPoint.sol";
import "../contracts/Helpers.sol";

contract TestChainPoint {

    function testCheckUsingDeployedContract() public {
        ChainPoint instance = ChainPoint(DeployedAddresses.ChainPoint());

        string memory userid = "0F623638-9B01-4ca6-A553-72709801DB1C";
        string memory username = "scott";

        //bytes32 expected = keccak256("abc");
        bytes32 expected = Helpers.stringToBytes32(userid);

        bytes32 returnUserid = instance.check(userid, username, 0);

        Assert.equal(returnUserid, expected, "userid was wrongly returned");
    }

    function testCheckPointDateUsingDeployedContract() public {
        ChainPoint instance = ChainPoint(DeployedAddresses.ChainPoint());

        string memory userid = "0F623638-9B01-4ca6-A553-72709801DB1C";
        string memory username = "scott";
        
        instance.check(userid, username, 0);
        uint checkpointdate = instance.getCheckDate(userid);

        Assert.notEqual(checkpointdate, 0, "checkDate was not correctly set");
    }

    function testGetCheckedUsersNumberUsingDeployedContract() public {
        ChainPoint instance = ChainPoint(DeployedAddresses.ChainPoint());

        string memory userid = "0F623638-9B01-4ca6-A553-72709801DB1C";
        string memory username = "scott";
        
        instance.check(userid, username, 0);

        uint usersNumber = instance.getCheckedUsersNumber();

        Assert.notEqual(usersNumber, 0, "usersNumber should not be null");
    }

    function testgetCheckedUserIdUsingDeployedContract() public {
        ChainPoint instance = ChainPoint(DeployedAddresses.ChainPoint());
        
        string memory userid = "0F623638-9B01-4ca6-A553-72709801DB1C";
        string memory username = "scott";
        bytes32 expected = Helpers.stringToBytes32(username);
        //bytes32 expected = keccak256("abc");
        
        instance.check(userid, username, 0);
        bytes32 checkedUser = instance.getCheckedUser(0);
        //bytes32 checkedUser = keccak256("abc");
        //var expected = "a";
        //var checkedUser = "b";
        Assert.notEqual(checkedUser, expected, "CheckedUsers was not correctly set");
    }
}