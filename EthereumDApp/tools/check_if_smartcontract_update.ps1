#region init
Set-PSDebug -Strict

$lastGitCommitLog = "lastGitCommitLog.log"

git log --name-status -n 1 > $lastGitCommitLog

# count occurences of contract updates
$contractUpdates = @( Get-Content $lastGitCommitLog | Where-Object { $_.Contains("contracts") } ).Count

if ($contractUpdates -gt 0) {
    Write-Host "##vso[task.setvariable variable=$triggerByBuild;]SmartContract" 
}
else {
    Write-Host "##vso[task.setvariable variable=$triggerByBuild;]AppCode"
}
