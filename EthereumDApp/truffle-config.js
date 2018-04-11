var DefaultBuilder = require("truffle-default-builder");

module.exports = {
  build: new DefaultBuilder({
    "index.html": "index.html",
    "app.css": "app.css",
    "app.js": "app.js",
    "img/": "img/",
    "js/": "js/",
    "bower_components/": "bower_components"
  }),
  networks: {
    production: {
      network_id: 180666,        // Custom ethereum template
      host: "hackminingnode0.northeurope.cloudapp.azure.com", // domain of ethereum client pointing to live network
      port: 8545
    },
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
      from: ""
    },
    consortium: {
      network_id: 8041971,        // Consortium ethereum template
      host: "bdfrlejdd.northeurope.cloudapp.azure.com:8545"
    }
  // },
  //   mocha: {  
  //   reporter: "mocha-junit-reporter",  
  //   reporterOptions: {  
  //     mochaFile: "truffle-mocha-test-results.xml"  
  //   }  
  }
};
