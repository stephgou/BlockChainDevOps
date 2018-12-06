[CmdletBinding()]
Param(  
    [Parameter(Mandatory=$False)] [string] $network = ""
    )

#region init
Set-PSDebug -Strict

$scriptFolder = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "scriptFolder" $scriptFolder

set-location $scriptFolder
set-location ".."
#endregion init

# Remove old test results  
Remove-Item .\xunit.xml -ea SilentlyContinue 

if ($network) {
    # Run the tests on the targeted truffle network  
    truffle test --network $network --reset
}
else {
    # Run the tests on truffle development network  
    truffle test
}