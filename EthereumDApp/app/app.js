'use strict';
var blockchain_provider = null;
var provider = null;
var contract = null;

if (localStorage.getItem("machine_id") === null) {
  var machine_id = prompt('ID de la machine');
  localStorage.setItem('machine_id', machine_id);
} else {
  var machine_id = localStorage.getItem("machine_id");
}

$('.machine-id').text('#'+machine_id);

var certified = [];
var http = false;
var user = null;
var qr = new QCodeDecoder();
var video = document.querySelector('video');
var contract, logs;

if (!(qr.isCanvasSupported() && qr.hasGetUserMedia())) {
  alert('Your browser doesn\'t match the required specs.');
  throw new Error('Canvas and getUserMedia are required');
}

function resultHandler (err, result) {
  if (err)
    return console.log(err.message);

  if (http) {
    return;
  }

  $('#loader-video').fadeIn();
  console.log('Getting user GUID');
  http = true;

  // Extract data
  var ids = result.split('/');
  var id = ids[ids.length - 1];
  console.log('GUID : ' + id);

  // Retrieve user name
  $.post('https://hackademy-webapi.azurewebsites.net/auth', {id: id}, function(data) {
  //$.post('http://localhost:1996/auth', {id: id}, function(data) {
    if (data.error) {
      alert('Error');
      http = false;
      $('.loader').fadeOut();
      return;
    }
    console.log(data);
    user = data;
    $('#loader').find('span').text(user.firstname);
    $('#loader').css('bottom', '0px');
    // Send to blockchain
    //stephgou -revoir logique
    //sendToBlockchain(id, user.firstname, machine_id);
    $('#loader-video').fadeOut();
    // Release lock
    setTimeout(function() {
      http = false;
      $('#loader').css('bottom', '-200px');
    }, 2000);
  });
}

qr.decodeFromCamera(video, resultHandler);

$(document).ready(function() {

  $.getJSON('config/Network.Local.config', function (config) {
    var network = config.network;
    var host = network.host;
    var port = network.port;
    blockchain_provider = "http://" + host + ":" + port;
    //console.log(blockchain_provider);
    // Set the provider you want from Web3.providers
    provider = new Web3.providers.HttpProvider(blockchain_provider);
    //console.log(provider);
    web3 = new Web3(provider);
    account_one = web3.eth.accounts[0];
    //console.log(account_one);

    $.getJSON('contracts/ChainPoint.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var contractArtifact = data;
      var myContract = TruffleContract(contractArtifact);
      myContract.setProvider(provider);

      myContract.defaults({from: account_one});

      myContract.deployed().then(instance => {

        contract = instance;
        //console.log(contract);

        var startWatch = false;
        //logs = contract.CheckPointAchieved({_from:web3.eth.coinbase},{fromBlock: 0, toBlock: 'latest'});
        events = contract.CheckPointAchieved({fromBlock: 'latest'});
        
        events.watch(function(error, result) {
          if (startWatch == true) {
            console.log("CheckPoint!");
            console.log(result.args.userid);
            console.log(result.args.username);
            console.log(result.args.step.toString());
            DOM_pushCheckpointDone(result.args.username, result.args.step.toString());
            // when the transaction mining occurs it's not necessary to broadcast the info to the EthereumDApp
            // because they should already be notified through the ethereum protocol
            //socket.emit('checkpoint_mined', {username: result.args.username, step: result.args.step.toString()});
          }
        startWatch = true;
        });
      });
    });
  });
});

function debugBlockchain() {
    sendToBlockchain("0F623638-9B01-4ca6-A553-72709801DB1C", "stephgou", machine_id);
}

// Send transaction to blockchain
function sendToBlockchain(id, username, step) {

  DOM_pushCheckpoint(username, step);
  // in order to notify any EthereumDApp that a new checkpoint is beginning
  // using a socket with EthereumDApi that will browser to all of the connected EthereumDApp applications
  socket.emit('checkpoint_begin', {username: username, step: step});
  contract.check(id, username, step, {from: account_one, gas: 200000}).then(function(tx) {
    console.log("Transaction successful! " + tx);
  }).catch(function(e) {
    // Transaction failed
    console.log("Transaction failed:");
    console.dir(e);
  });
}

var template_certification = '<li><span class="date">{{ time }}</span><span class="puce"></span><span class="name">{{ firstname }} <i data-twitter="{{ twitter }}" data-firstname="{{firstname}}" class="fa fa-twitter"></i></span><span class="status">Vous êtes certifié</span><span class="link"><a href="{{ pdf }}" target="blank"><i class="fa fa-file-pdf-o"></i> {{ pdf }}</a></span><i class="icone fa fa-check"></i></li>';
var template_checkpoint = '<li><span class="date">{{ time }}</span><span class="puce"></span><span class="name">{{ firstname }}</span><span class="status">Minage en cours ... #{{ step }}</span><i class="icone fa fa-clock-o"></i></li>';
var template_checkpoint_done = '<li><span class="date">{{ time }}</span><span class="puce"></span><span class="name">{{ firstname }}</span><span class="status">Miné ! #{{ step }}</span><i class="icone fa fa-plus"></i></li>';

function DOM_pushCheckpoint(firstname, step) {
  $('.content-checkpoint').find('ul').prepend(Mustache.render(template_checkpoint, {time: getTime(), firstname: firstname, step: step}));
}

function DOM_pushCheckpointDone(firstname, step) {
  $('.content-checkpoint').find('ul').prepend(Mustache.render(template_checkpoint_done, {time: getTime(), firstname: firstname, step: step}));
}

function DOM_pushCertification(firstname, pdf, time, twitter) {
  $('.content-certification').find('ul').prepend(Mustache.render(template_certification, {twitter: twitter, time: time, firstname: firstname, pdf: pdf}));
}

$('.content-certification ul').on('click', '.fa-twitter', function() {
  $('#modal').find('.modal-title span').text($(this).data('firstname'));
  $('#modal').find('.modal-body iframe').attr('src', "http://twitframe.com/show?url="+$(this).data('twitter'));
  $('#modal').modal('toggle');
});

var socket = io.connect('https://hackademy-webapi.azurewebsites.net');
//var socket = io.connect('http://localhost:1996');
socket.on('user_complete', function(users_complete) {
  for (var i = 0, len = users_complete.length; i < len; i++) {
    if (certified.indexOf(users_complete[i].id) == -1) {
      certified.push(users_complete[i].id);
      DOM_pushCertification(users_complete[i].username, users_complete[i].pdf, users_complete[i].time, users_complete[i].twitter);
    }
  }
  $('.certified').text(certified.length);
});

socket.on('user_complete_new', function(user_complete) {
  if (certified.indexOf(user_complete.id) == -1) {
    certified.push(user_complete.id);
    DOM_pushCertification(user_complete.username, user_complete.pdf, user_complete.time, user_complete.twitter);
  }
  $('.certified').text(certified.length);
});

socket.on('checkpoint_begin', function(user_checkpoint) {
  DOM_pushCheckpoint(user_checkpoint.username, user_checkpoint.step);
});

socket.on('checkpoint_mined', function(user_checkpoint) {
  DOM_pushCheckpointDone(user_checkpoint.username, user_checkpoint.step);
});

var resize = function() {
  //$('video').css('height', $('video').height());
};

resize();

$(window).on('resize', resize);

var getTime = function() {
  var d = new Date();
  return ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2)
};
