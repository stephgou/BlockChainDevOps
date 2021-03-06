[CmdletBinding()]
Param(
    [Parameter(Mandatory=$True)] [string] $network,
    [Parameter(Mandatory=$True)] [string] $directory
)

#region init
Set-PSDebug -Strict

$truffleNetworkFile = "$directory\truffle-networks.json"

$networks = @( Get-Content $truffleNetworkFile | ConvertFrom-Json)

$HostName = $networks."networks".$network.host
$PortNumber = $networks."networks".$network.port

$sourceFile = "$directory\app\config\Network.Cloud.config"
$destinationFile = "$directory\build\config\Network.Local.json"

# Read file
$content = Get-Content -Path $Sourcefile
# substitute values
$content = $content.Replace("<HOSTNAME>", $HostName)
$content = $content.Replace("<PORTNUMBER>", $PortNumber)
# Save
[System.IO.File]::WriteAllText($destinationFile, $content)