#region init
Set-PSDebug -Strict

$scriptFolder = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "scriptFolder" $scriptFolder

set-location $scriptFolder
#endregion init

#Extract networks json config from truffleConfigFile
#$truffleConfigFile = "..\truffle-config.js"
#$truffleConfig = Get-Content -Path $truffleConfigFile -Raw
#$s = $truffleConfig.SubString($truffleConfig.IndexOf("networks"))
#$s = "{" + $s
#DoubleQuote words withing extract (Still have to complete)

$truffleNetworkFile = "..\truffle-networks.json"

$networks = @( Get-Content $truffleNetworkFile | ConvertFrom-Json)

$targetNetwork = "consortium_member_integ"

echo $networks."networks".$targetNetwork.port
echo $networks."networks".$targetNetwork.host
