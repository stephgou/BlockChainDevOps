Param(
     [string]$resourceGroup,
     [string]$storageAccount,
     [string]$directory,
     [string]$container,
     [string]$zip)

#region init
Set-PSDebug -Strict

$scriptFolder = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "scriptFolder" $scriptFolder

#set-location $scriptFolder

#endregion init

Write-Host $resourceGroup + " " + $storageAccount + " " +  $container + "  " + $zip
New-Item -ItemType directory -Path "$directory\$container"
$storage = Get-AzureRmStorageAccount -ResourceGroupName $resourceGroup -Name $storageAccount
$storage.Context | Get-AzureStorageBlobContent -Container $container -Blob $zip -Destination "$directory\$container\$zip"