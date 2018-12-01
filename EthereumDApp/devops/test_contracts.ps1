[CmdletBinding()]
Param(  
    [Parameter(Mandatory=$True)] [string] $network = ""
    )

# Remove old test results  
Remove-Item .\xunit.xml -ea SilentlyContinue 

if ($network) {
    # Run the tests on the targeted truffle network  
    truffle test --network $network --reset
}
else {
    # Run the tests on truffle development network  
    truffle test --network $network --reset
}