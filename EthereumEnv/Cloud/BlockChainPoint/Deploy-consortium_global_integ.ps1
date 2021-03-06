﻿Param(  
    # Name of the subscription to use for azure cmdlets
    $subscriptionName = "stephgou - Internal",
    $subscriptionId = "b1256985-d559-406d-a0ca-f47d72fed1e2",
    #Paramètres du Azure Ressource Group
    $resourceGroupName = "SG-RG-OSSPARIS-DEMO",
    $resourceLocation = "North Europe",
	$resourceGroupDeploymentName = "OSSPARISG-Demo-Deployed",
    $templateFile = "consortium_global_integ.json",
    $templateParameterFile = "consortium_global_integ.parameters.json",
    $templateFolder = "OssParisTemplates",
    $tagName = "OssParisG",
    $tagValue = "Ethereum"
    )

#region init
Set-PSDebug -Strict

cls
$d = get-date
Write-Host "Starting Deployment $d"

$scriptFolder = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "scriptFolder" $scriptFolder

set-location $scriptFolder
#endregion init

#Login-AzureRmAccount -SubscriptionId $subscriptionId

# Resource group create
New-AzureRmResourceGroup `
	-Name $resourceGroupName `
	-Location $resourceLocation `
    -Tag @{Name=$tagName;Value=$tagValue} `
    -Verbose

# Resource group deploy
New-AzureRmResourceGroupDeployment `
    -Name $resourceGroupDeploymentName `
	-ResourceGroupName $resourceGroupName `
	-TemplateFile "$scriptFolder\$templatefolder\$templateFile" `
	-TemplateParameterFile "$scriptFolder\$templatefolder\$templateParameterFile" `
    -Debug -Verbose -DeploymentDebugLogLevel All

$d = get-date
Write-Host "Stopping Deployment $d"