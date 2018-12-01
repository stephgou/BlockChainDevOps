#region init
Set-PSDebug -Strict

$scriptFolder = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "scriptFolder" $scriptFolder

set-location $scriptFolder
#endregion init

set-location ".."

# Install default builder for truffle
npm install truffle-default-builder --save

# Fix issue in default builder for truffle
./tools/fix_include_contracts.ps1

# Truffle build  
truffle build

# Remove old test results  
Remove-Item .\xunit.xml -ea SilentlyContinue 

# Run the tests on truffle development network  
truffle test