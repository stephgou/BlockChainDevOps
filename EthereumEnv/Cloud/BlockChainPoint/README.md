# BlockChainPoint automated provisionning and configuration

This Microsoft Azure template deploys a set of Ethereum nodes with a private chain for development and testing.

[![Deploy to Azure](http://azuredeploy.net/deploybutton.png)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3a%2f%2fraw.githubusercontent.com%2fDXFrance%2fBlockchainPoint%2fmaster%2fEthereumEnv%2fCloud%2fBlockChainPoint%2fTemplates%2fazuredeploy.json)

<a href="http://armviz.io/#/?load=https%3a%2f%2fraw.githubusercontent.com%2fDXFrance%2fBlockchainPoint%2fmaster%2fEthereumEnv%2fCloud%2fBlockChainPoint%2fTemplates%2fazuredeploy.json" target="_blank">
    <img src="http://armviz.io/visualizebutton.png"/>
</a>

Once your deployment is complete you will have a sandbox environment with:

...

# Template Parameters
When you launch the installation of the Ethereum nodes, you need to specify the following parameters:
- 
* `resourceNamePrefix`:This is the prefix that will used to name all the provisioned resources
* `vmDnsPrefix`: this is the public DNS name for the VM that you will use interact with your geth console. You just need to specify an unique name.
* `vmSize`: The type of VM that you want to use for the node. The default size is D1 (1 core 3.5GB RAM) but you can change that if you expect to run workloads that require more RAM or CPU resources.
* `adminUsername`: Administrator username of each deployed Etehreum VM". This is the account you will use for connecting to the node
* `adminPassword`: Administrator password for each deployed Ethereum VM Node. Be aware that Azure requires passwords to have One upper case, one lower case, a special character, and a number
* `sshKeyData`: ssh key to log on Ethereum nodes
* `ethereumAccountAddress`: Prefunded Ethereum account address
* `ethereumAccountPassword`: Administrator password used to secure the generated private key file associated with the created Ethereum account
* `ethereumAccountKey`: Private key used to generate account prefunded with Ether
* `ethereumNetworkID`: Private Ethereum network ID to which to connect
* `ethereumMiningNodesNumber`: Number of mining members within the consensus network
* `svcPlanSku`: The pricing tier of the App Service plan
* `svcPlanSize`: The instance size of the App Service Plan

....

