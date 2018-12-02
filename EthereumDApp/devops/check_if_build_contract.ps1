[CmdletBinding()]
Param(  
    [Parameter(Mandatory=$True)] [string] $dropFolder = ""
    )

#region init
Set-PSDebug -Strict


$buildFiles = @( Get-ChildItem $dropFolder | Measure-Object ).Count

if ($buildFiles -gt 1) {
    Write-Host "Smart Contract" 
    Write-Host "##vso[task.setvariable variable=triggerByBuild;]SmartContract" 
}
else {
    Write-Host "Application Code"    
    Write-Host "##vso[task.setvariable variable=triggerByBuild;]AppCode"
}

#endregion init
