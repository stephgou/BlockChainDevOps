var sha256 = require('sha256');
var btoa = require('btoa');
var request = require('sync-request');

var WOOLEET = request('POST', 'https://api.woleet.io/v1/anchor', {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('tconte@microsoft.com:6Q8UkKCrSl8=')
    },
    json: {
      name: 'BlockChainPoint - Sofiene',
      hash: sha256('salutCMoi')
    }
});
WOOLEET = JSON.parse(WOOLEET.getBody('utf8'));

console.log(WOOLEET);
