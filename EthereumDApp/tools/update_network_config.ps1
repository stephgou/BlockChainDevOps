[CmdletBinding()]
Param(
    [Parameter(Mandatory=$True)] [string] $HostName,    # HostName
    [Parameter(Mandatory=$True)] [string] $PortNumber   # Port
)

#region init
Set-PSDebug -Strict

$sourceFile = "..\app\config\Network.Cloud.config"
$destinationFile = "..\app\config\Network.Local.config"

# Read file
$content = Get-Content -Path $Sourcefile
# substitute values
$content = $content.Replace("<HOSTNAME>", $HostName)
$content = $content.Replace("<PORTNUMBER>", $PortNumber)
# Save
[System.IO.File]::WriteAllText($destinationFile, $content)