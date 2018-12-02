[CmdletBinding()]
Param(
    [Parameter(Mandatory=$True)] [string] $network
)

#region init
Set-PSDebug -Strict

$truffleNetworkFile = "..\truffle-networks.json"

$networks = @( Get-Content $truffleNetworkFile | ConvertFrom-Json)

$HostName = $networks."networks".$network.port
$PortNumber = $networks."networks".$network.host

$sourceFile = "..\app\config\Network.Cloud.config"
$destinationFile = "..\app\config\Network.Local.config"

# Read file
$content = Get-Content -Path $Sourcefile
# substitute values
$content = $content.Replace("<HOSTNAME>", $HostName)
$content = $content.Replace("<PORTNUMBER>", $PortNumber)
# Save
[System.IO.File]::WriteAllText($destinationFile, $content)