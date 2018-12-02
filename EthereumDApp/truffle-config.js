var DefaultBuilder = require("truffle-default-builder");

module.exports = {
  build: new DefaultBuilder({
    "index.html": "index.html",
    "app.css": "app.css",
    "config/": "config/",
    "app.js": "app.js",
    "img/": "img/",
    "js/": "js/",
    "bower_components/": "bower_components"
  }),
  compilers: {
    solc: {
      version: "0.4.24",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    //Keep development name for truffle network
    developper: {
      network_id: "*",
      host: "localhost",
      port: 8545,
    },
    consortium_member_integ: {
      network_id: 180663,
      host: "consortium_member_integ0.northeurope.cloudapp.azure.com",
      port: 7545
    },
    consortium_global_integ: {
      network_id: 180664,        // Custom ethereum template
      host: "consortium_global_integ0.northeurope.cloudapp.azure.com", // domain of ethereum client pointing to live network
      port: 8545
    },
    consortium_global_staging: {
      network_id: 180665,        // Custom ethereum template
      host: "consortium_global_staging0.northeurope.cloudapp.azure.com", // domain of ethereum client pointing to live network
      port: 8545
    },
    consortium_global_production: {
      network_id: 180666,        // Consortium ethereum template
      host: "consortium_global_prod0.northeurope.cloudapp.azure.com:8545"
    }
  },
  mocha: {  
    //reporter: "mocha-junit-reporter",  
    reporter: "mocha-multi-reporters"  
    // mochaFile will be xunit.xml -> TODO update truffle for multi-reporters options
    // reporterOptions: {  
    //   mochaFile: "truffle-mocha-test-results.xml"
    // }
  }  
};
