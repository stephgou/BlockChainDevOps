var express     = require('express');
var app         = express();
var fs = require('fs');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var certified = JSON.parse(fs.readFileSync('certified.json'));
var bodyParser  = require('body-parser');
var pdf = require('html-pdf');
var ejs = require('ejs');
var html = fs.readFileSync('pdf.html', 'utf-8');
var config = require('./config');
var token;
var request = require('sync-request');
var user_complete = certified;
var cors = require('cors');

var sha256 = require('sha256');
var btoa = require('btoa');

var Twitter = require('twitter');
var client = new Twitter({
  consumer_key: 'q5yuIouiDvVJDKKbiIp4zhOBJ',
  consumer_secret: '8Mf2DjLcuXPdZbYlqJ3eRBrSelKaxyDRMEUwnfzE3U4OfrNWEV',
  access_token_key: '783286632829124608-J8xrrbmHdTuQBKvGIzjiCW8lPVYKgWr',
  access_token_secret: 'AKZVnC0Vu5qzlYYDzyzlX8VeVZrlTRO9H9J44LMDS3avE'
});

var oauth2 = require('simple-oauth2').create({
  client: {
    id: config.client_id,
    secret: config.client_secret
  },
  auth: {
    tokenHost: config.host,
    tokenPath: config.token_url,
    authorizePath: config.auth_url
  }
});

var getToken = function() {
  oauth2.clientCredentials.getToken({scope: config.scope}, (error, result) => {
    if (error) {
      return console.log('Access Token Error', error.message);
    }
    token = oauth2.accessToken.create(result).token.access_token;
    console.log('Token : ' + token);
    setUpBlockChainWatch(); // TODO: add callback
  });
};

getToken();

app.use(cors());
app.options('*', cors());

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Ocp-Apim-Subscription-Key");
  next();
});

app.use(bodyParser());
app.use( bodyParser.json({limit: '50mb'}) );
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit:50000
}));

app.post('/auth', function(req, res){
  var id = req.body.id;
  return res.json(getUser(id));
});

// Check anchor
app.get('/anchor/:id', function(req, res) {
  var id = req.params.id;
  var woleet_anchor = request('GET', 'https://api.woleet.io/v1/anchor/' + id, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa('tconte@microsoft.com:6Q8UkKCrSl8=')
    }
  });
  var anchor_body = woleet_anchor.getBody('utf8');
  var anchor = JSON.parse(anchor_body);
  if (anchor.status == 'CONFIRMED') {
    // Retrieve and display the receipt
    var woleet_receipt = request('GET', 'https://api.woleet.io/v1/receipt/' + id, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('tconte@microsoft.com:6Q8UkKCrSl8=')
      }
    });
    var receipt_body = woleet_receipt.getBody('utf8');
    var receipt = JSON.parse(receipt_body);
  }
  return res.render('anchor', {
    anchorJson: JSON.stringify(anchor, null, 2), 
    status: anchor.status, 
    receiptJson: JSON.stringify(receipt, null, 2)
  });
});

// Blockchain events

var ChainPoint = require('./ChainPoint.sol.js');
var Web3 = require('web3');

var abi = ChainPoint.all_networks['default'].abi;
//var address = "0x770947bf54dad3de48ab62be1a05178c21afcd1c";
var address = "0x5ba96d21c6b3e6ebaae1394c52fb361058c32913";

var web3 = new Web3(new Web3.providers.HttpProvider("http://hackminingnode0.northeurope.cloudapp.azure.com:8545"));
//var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

var contract = web3.eth.contract(abi).at(address);

// Run server

server.listen(process.env.PORT || 1996);

function statPath(path) {
  try {
    return fs.statSync(path);
  } catch (ex) {}
  return false;
}

io.on('connection', function (socket) {
  socket.emit('user_complete', user_complete);
  socket.on('checkpoint_begin', function(data) {
  // in order to notify any EthereumDApp that a new checkpoint is beginning
    socket.broadcast.emit('checkpoint_begin', data);
    console.log('checkpoint_begin');
  });
  // when the transaction mining occurs it's not necessary to broadcast the info to the EthereumDApp
  // because they should already be notified through the ethereum protocol
  //socket.on('checkpoint_mined', function(data) {
  //  socket.broadcast.emit('checkpoint_mined', data);
  //  console.log('checkpoint_mined');
  //});
});

function getUser(id) {
  var user = request('GET', 'https://api.inwink.com/' + config.event_id + '/registered/' + id, {
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
      }
  });
  if (user.statusCode > 300)
  {
      user = request('GET', 'https://api.inwink.com/' + config.event_id + '/speaker/' + id, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
      });
      if (user.statusCode > 300)
      {
          user = request('GET', 'https://api.inwink.com/' + config.event_id + '/exhibitor/account/' + id, {
                      headers: {
                          'Content-Type': 'application/json',
                          'Authorization': 'Bearer ' + token
                      }
          });
          if (user.statusCode > 300)
          {
              user = null;
          }
      }
  }

  if (user != null)
    user = JSON.parse(user.getBody('utf8'));

  return user;
}

function createLink(link) {
  var bitly = request('GET', 'https://api-ssl.bitly.com/v3/user/link_save?access_token=8e21360de7ecca4648c3f588b5919c15ea7dde63&longUrl='+link);

  bitly = JSON.parse(bitly.getBody('utf8')).data.link_save.link;
  return bitly;
}

var setupOK = false;

function setUpBlockChainWatch() {
  if (setupOK) return; // Only run once
  setupOK = true;

  var logs = contract.JourneyAchieved({fromBlock: 'latest'});

  logs.watch(function(error, result) {
    if (typeof result === 'undefined') {
      return;
    }
    for (var i = 0, len = user_complete.length; i < len; i++) {
      if (user_complete[i].id == result.args.userid) {
        //User already have a certification
        return;
      }
    }
    console.log("Journey Achieved!");
    console.log(result.args.userid);
    console.log(result.args.username);
    var user = getUser(result.args.userid);
    var html_data = ejs.render(html, { firstname: user.firstname, time: getDateTime(), hash: {
      transaction: result.transactionHash,
      block: result.blockHash,
      number: result.blockNumber
    }});
    pdf.create(html_data, {format: 'Letter'}).toFile('public/' + result.args.userid + '.pdf', function(err, response) {

      var pdf_link = createLink('https://hackademy-webapi.azurewebsites.net/' + result.args.userid + '.pdf');

      var woleet_anchor = request('POST', 'https://api.woleet.io/v1/anchor', {
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa('tconte@microsoft.com:6Q8UkKCrSl8=')
          },
          json: {
            name: 'BlockChainPoint - '+result.args.username,
            hash: sha256(pdf_link)
          }
      });
      woleet_anchor = JSON.parse(woleet_anchor.getBody('utf8'));

      client.post('statuses/update', {
          status: "#experiences " 
            + (((user.twitter != undefined) && (user.twitter != "")) ? '@'+user.twitter : result.args.username) 
            + " a essayé la blockchain avec nous ! La preuve " 
            + pdf_link 
            + " est ancrée @woleet " 
            + createLink("http://hackademy-webapi.azurewebsites.net/anchor/" + woleet_anchor.id)
        }, function(error, tweet, response){
        var user_complete_new = {id: result.args.userid, username: result.args.username, pdf: pdf_link, time: getTime(), twitter: ((typeof tweet.id_str !== "undefined") ? 'https://twitter.com/chainhackademy/status/' + tweet.id_str : null ), woleet :  woleet_anchor};
        user_complete.push(user_complete_new);
        fs.writeFile('certified.json', JSON.stringify(user_complete), 'utf8');
        io.sockets.emit('user_complete_new', user_complete_new);
      });
    });
  });
}

var getTime = function() {
  var d = new Date();
  return ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2)
};

var getDateTime = function() {
  var d = new Date();
  return ('0' + d.getDate()).slice(-2) + "/" + ('0' + d.getMonth()).slice(-2) + "/" + d.getFullYear() + " " + getTime()
};

setInterval(function() {
  getToken();
}, 3600000);
