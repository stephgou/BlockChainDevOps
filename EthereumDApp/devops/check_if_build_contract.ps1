[CmdletBinding()]
Param(  
    [Parameter(Mandatory=$True)] [string] $dropFolder = ""
    )

#region init
Set-PSDebug -Strict

Write-Host $dropFolder
$buildFiles = ( Get-ChildItem $dropFolder | Measure-Object ).Count
Write-Host $buildFiles

if ($buildFiles -gt 2) {
    Write-Host "Smart Contract" 
    Write-Host "##vso[task.setvariable variable=triggerByBuild;]SmartContract" 
}
else {
    Write-Host "Application Code"    
    Write-Host "##vso[task.setvariable variable=triggerByBuild;]AppCode"
}

#endregion init
