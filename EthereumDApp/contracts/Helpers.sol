pragma solidity ^0.4.17;

library Helpers {
 
    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
    
/*         assembly {
            result := mload(add(source, 32))
        }
        //require requires solidity compiler 0.4.10 which is not the one bundled with truffle 3.2.1
        //which seems to be the last version with a working truffle serve feature
        //require(result.length != 1 && result.length < 256);

        if(result.length == 1 || result.length < 256)
            throw; */

        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }
}