var Web3 = require("web3");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  return accept(tx, receipt);
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("ChainPoint error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("ChainPoint error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("ChainPoint contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of ChainPoint: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to ChainPoint.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: ChainPoint not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "1337": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "userid",
            "type": "string"
          },
          {
            "name": "username",
            "type": "string"
          },
          {
            "name": "step",
            "type": "uint256"
          }
        ],
        "name": "check",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "userid",
            "type": "string"
          }
        ],
        "name": "getCheckDate",
        "outputs": [
          {
            "name": "date",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "userid",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "username",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "step",
            "type": "uint256"
          }
        ],
        "name": "CheckPointAchieved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "userid",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "username",
            "type": "string"
          }
        ],
        "name": "JourneyAchieved",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x6060604052610671806100126000396000f3606060405260e060020a6000350463e3c21b478114610026578063fac78235146100d7575b005b6100246004808035906020019082018035906020019191908080601f01602080910402602001604051908101604052809392919081815260200183838082843750506040805160208835808b0135601f8101839004830284018301909452838352979998604498929750919091019450909250829150840183828082843750949650509335935050505060c06040519081016040528083815260200142815260200182600014610184576000610187565b6101726004808035906020019082018035906020019191908080601f016020809104026020016040519081016040528093929190818152602001838380828437509496505050505050506000600060005082604051808280519060200190808383829060006004602084601f0104600302600f01f1509050019150509081526020016040518091039020600050600101600050549050919050565b60408051918252519081900360200190f35b60015b81526020018260011461019b57600061019e565b60015b8152602001826002146101b25760006101b5565b60015b8152602001826003146101c95760016101cc565b60015b815260200150600060005084604051808280519060200190808383829060006004602084601f0104600302600f01f15090500191505090815260200160405180910390206000506000820151816000016000509080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061028057805160ff19168380011785555b506102b09291505b8082111561066d576000815560010161026c565b82800160010185558215610264579182015b82811115610264578251826000505591602001919060010190610292565b50506020828101516001830155604083810151600293909301805460608681015160808881015160a0999099015160ff199490941690971761ff001916610100919091021762ff0000191662010000979097029690961763ff0000001916630100000091909102179055805190810185905283815286519381019390935285517f177fc46b374d052a43730697ea19c9b6811c1e6b2c8628042268177bd14f29079387938793879383928383019290840191888201918190849082908590600090600490601f850104600302600f01f150905090810190601f1680156103aa5780820380516001836020036101000a031916815260200191505b508381038252858181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156104035780820380516001836020036101000a031916815260200191505b509550505050505060405180910390a1600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160009054906101000a900460ff1680156104bf5750600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160019054906101000a900460ff165b80156105195750600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160029054906101000a900460ff165b80156105735750600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160039054906101000a900460ff165b15610668577f4184339a4a38144e8fb215948228558728a07291855342962f4ec7565db9770983836040518080602001806020018381038352858181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156105ff5780820380516001836020036101000a031916815260200191505b508381038252848181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156106585780820380516001836020036101000a031916815260200191505b5094505050505060405180910390a15b505050565b509056",
    "updated_at": 1474491224846,
    "links": {},
    "address": "0xdeec51d4e7920d4233949ece5ed886f10e77d248"
  },
  "112358": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "userid",
            "type": "string"
          },
          {
            "name": "username",
            "type": "string"
          },
          {
            "name": "step",
            "type": "uint256"
          }
        ],
        "name": "check",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "userid",
            "type": "string"
          }
        ],
        "name": "getCheckDate",
        "outputs": [
          {
            "name": "date",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "userid",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "username",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "step",
            "type": "uint256"
          }
        ],
        "name": "CheckPointAchieved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "userid",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "username",
            "type": "string"
          }
        ],
        "name": "JourneyAchieved",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x6060604052610810806100126000396000f3606060405260e060020a6000350463e3c21b478114610026578063fac78235146101e3575b005b6100246004808035906020019082018035906020019191908080601f01602080910402602001604051908101604052809392919081815260200183838082843750506040805160208835808b0135601f81018390048302840183019094528383529799986044989297509190910194509092508291508401838280828437509496505093359350505050600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060010160005054600014156102f75760c0604051908101604052808381526020014281526020016000815260200160008152602001600081526020016000815260200150600060005084604051808280519060200190808383829060006004602084601f0104600302600f01f15090500191505090815260200160405180910390206000506000820151816000016000509080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106107dc57805160ff19168380011785555b506102909291505b8082111561080c57600081556001016101cf565b61027e6004808035906020019082018035906020019191908080601f016020809104026020016040519081016040528093929190818152602001838380828437509496505050505050506000600060005082604051808280519060200190808383829060006004602084601f0104600302600f01f1509050019150509081526020016040518091039020600050600101600050549050919050565b60408051918252519081900360200190f35b505060208201516001820155604082015160029190910180546060840151608085015160a0959095015163010000000262010000959095026101009190910260ff199290921690931761ff0019161762ff000019169190911763ff00000019169190911790555b806000141561035c576001600060005084604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160006101000a81548160ff021916908302179055505b80600114156103c1576001600060005084604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160016101000a81548160ff021916908302179055505b8060021415610426576001600060005084604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160026101000a81548160ff021916908302179055505b806003141561048b576001600060005084604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160036101000a81548160ff021916908302179055505b7f177fc46b374d052a43730697ea19c9b6811c1e6b2c8628042268177bd14f29078383836040518080602001806020018481526020018381038352868181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156105195780820380516001836020036101000a031916815260200191505b508381038252858181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156105725780820380516001836020036101000a031916815260200191505b509550505050505060405180910390a1600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160009054906101000a900460ff16801561062e5750600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160019054906101000a900460ff165b80156106885750600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160029054906101000a900460ff165b80156106e25750600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160039054906101000a900460ff165b156107d7577f4184339a4a38144e8fb215948228558728a07291855342962f4ec7565db9770983836040518080602001806020018381038352858181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f16801561076e5780820380516001836020036101000a031916815260200191505b508381038252848181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156107c75780820380516001836020036101000a031916815260200191505b5094505050505060405180910390a15b505050565b828001600101855582156101c7579182015b828111156101c75782518260005055916020019190600101906107ee565b509056",
    "updated_at": 1474819927028,
    "links": {},
    "address": "0x4611c52fe74bbeb6274b9e9328c9d31e3b7ab54b"
  },
  "180666": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "userid",
            "type": "string"
          },
          {
            "name": "username",
            "type": "string"
          },
          {
            "name": "step",
            "type": "uint256"
          }
        ],
        "name": "check",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "userid",
            "type": "string"
          }
        ],
        "name": "getCheckDate",
        "outputs": [
          {
            "name": "date",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "userid",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "username",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "step",
            "type": "uint256"
          }
        ],
        "name": "CheckPointAchieved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "userid",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "username",
            "type": "string"
          }
        ],
        "name": "JourneyAchieved",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x6060604052610671806100126000396000f3606060405260e060020a6000350463e3c21b478114610026578063fac78235146100d7575b005b6100246004808035906020019082018035906020019191908080601f01602080910402602001604051908101604052809392919081815260200183838082843750506040805160208835808b0135601f8101839004830284018301909452838352979998604498929750919091019450909250829150840183828082843750949650509335935050505060c06040519081016040528083815260200142815260200182600014610184576000610187565b6101726004808035906020019082018035906020019191908080601f016020809104026020016040519081016040528093929190818152602001838380828437509496505050505050506000600060005082604051808280519060200190808383829060006004602084601f0104600302600f01f1509050019150509081526020016040518091039020600050600101600050549050919050565b60408051918252519081900360200190f35b60015b81526020018260011461019b57600061019e565b60015b8152602001826002146101b25760006101b5565b60015b8152602001826003146101c95760016101cc565b60015b815260200150600060005084604051808280519060200190808383829060006004602084601f0104600302600f01f15090500191505090815260200160405180910390206000506000820151816000016000509080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061028057805160ff19168380011785555b506102b09291505b8082111561066d576000815560010161026c565b82800160010185558215610264579182015b82811115610264578251826000505591602001919060010190610292565b50506020828101516001830155604083810151600293909301805460608681015160808881015160a0999099015160ff199490941690971761ff001916610100919091021762ff0000191662010000979097029690961763ff0000001916630100000091909102179055805190810185905283815286519381019390935285517f177fc46b374d052a43730697ea19c9b6811c1e6b2c8628042268177bd14f29079387938793879383928383019290840191888201918190849082908590600090600490601f850104600302600f01f150905090810190601f1680156103aa5780820380516001836020036101000a031916815260200191505b508381038252858181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156104035780820380516001836020036101000a031916815260200191505b509550505050505060405180910390a1600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160009054906101000a900460ff1680156104bf5750600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160019054906101000a900460ff165b80156105195750600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160029054906101000a900460ff165b80156105735750600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160039054906101000a900460ff165b15610668577f4184339a4a38144e8fb215948228558728a07291855342962f4ec7565db9770983836040518080602001806020018381038352858181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156105ff5780820380516001836020036101000a031916815260200191505b508381038252848181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156106585780820380516001836020036101000a031916815260200191505b5094505050505060405180910390a15b505050565b509056",
    "updated_at": 1474040127714,
    "links": {},
    "address": "0xec6ee82a2b229aee9c68a4ed1d025d6ea8a2c343"
  },
  "default": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "userid",
            "type": "string"
          },
          {
            "name": "username",
            "type": "string"
          },
          {
            "name": "step",
            "type": "uint256"
          }
        ],
        "name": "check",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "userid",
            "type": "string"
          }
        ],
        "name": "getCheckDate",
        "outputs": [
          {
            "name": "date",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "userid",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "username",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "step",
            "type": "uint256"
          }
        ],
        "name": "CheckPointAchieved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "userid",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "username",
            "type": "string"
          }
        ],
        "name": "JourneyAchieved",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x6060604052610810806100126000396000f3606060405260e060020a6000350463e3c21b478114610026578063fac78235146101e3575b005b6100246004808035906020019082018035906020019191908080601f01602080910402602001604051908101604052809392919081815260200183838082843750506040805160208835808b0135601f81018390048302840183019094528383529799986044989297509190910194509092508291508401838280828437509496505093359350505050600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060010160005054600014156102f75760c0604051908101604052808381526020014281526020016000815260200160008152602001600081526020016000815260200150600060005084604051808280519060200190808383829060006004602084601f0104600302600f01f15090500191505090815260200160405180910390206000506000820151816000016000509080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106107dc57805160ff19168380011785555b506102909291505b8082111561080c57600081556001016101cf565b61027e6004808035906020019082018035906020019191908080601f016020809104026020016040519081016040528093929190818152602001838380828437509496505050505050506000600060005082604051808280519060200190808383829060006004602084601f0104600302600f01f1509050019150509081526020016040518091039020600050600101600050549050919050565b60408051918252519081900360200190f35b505060208201516001820155604082015160029190910180546060840151608085015160a0959095015163010000000262010000959095026101009190910260ff199290921690931761ff0019161762ff000019169190911763ff00000019169190911790555b806000141561035c576001600060005084604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160006101000a81548160ff021916908302179055505b80600114156103c1576001600060005084604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160016101000a81548160ff021916908302179055505b8060021415610426576001600060005084604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160026101000a81548160ff021916908302179055505b806003141561048b576001600060005084604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160036101000a81548160ff021916908302179055505b7f177fc46b374d052a43730697ea19c9b6811c1e6b2c8628042268177bd14f29078383836040518080602001806020018481526020018381038352868181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156105195780820380516001836020036101000a031916815260200191505b508381038252858181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156105725780820380516001836020036101000a031916815260200191505b509550505050505060405180910390a1600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160009054906101000a900460ff16801561062e5750600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160019054906101000a900460ff165b80156106885750600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160029054906101000a900460ff165b80156106e25750600060005083604051808280519060200190808383829060006004602084601f0104600302600f01f150905001915050908152602001604051809103902060005060020160039054906101000a900460ff165b156107d7577f4184339a4a38144e8fb215948228558728a07291855342962f4ec7565db9770983836040518080602001806020018381038352858181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f16801561076e5780820380516001836020036101000a031916815260200191505b508381038252848181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156107c75780820380516001836020036101000a031916815260200191505b5094505050505060405180910390a15b505050565b828001600101855582156101c7579182015b828111156101c75782518260005055916020019190600101906107ee565b509056",
    "updated_at": 1474818955085,
    "links": {},
    "address": "0x16430f97102c74e556de0ff9ca6f1e34d09de533"
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "object") {
      Object.keys(name).forEach(function(n) {
        var a = name[n];
        Contract.link(n, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "ChainPoint";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.1.2";

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.ChainPoint = Contract;
  }
})();
