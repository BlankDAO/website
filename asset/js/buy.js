var crowdsaleContract = (blankTkenContract = stableTokenContract = sellContract = null);
var enoughFund = false;

$(".just-number").keypress(function (eve) {
  if (
    ((eve.which != 46 ||
        $(this)
        .val()
        .indexOf(".") != -1) &&
      (eve.which < 48 || eve.which > 57)) ||
    (eve.which == 46 && $(this).caret().start == 0)
  ) {
    eve.preventDefault();
  }

  $(".just-number").keyup(function (eve) {
    if (
      $(this)
      .val()
      .indexOf(".") == 0
    ) {
      $(this).val(
        $(this)
        .val()
        .substring(1)
      );
    }
  });
});

function clearInputs() {
  $("#bdt").val("");
  $("#dai").val("");
  $("#ref").val("");
}

function updateBDTamount() {
  let rpcUrl = "https://mainnet.infura.io/v3/81a17a01107e4ac9bf8a556da267ae2d";
  var InfuraWeb3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
  var crowdsale_contract_ = InfuraWeb3.eth.contract(abiCrowdsale);
  let crowdsaleContract_ = crowdsale_contract_.at(config.crowdsaleAddress);

  var blank_token_contract_ = InfuraWeb3.eth.contract(abiBlankToken);
  let blankTkenContract_ = blank_token_contract_.at(config.blankTokenAddress);

  blankTkenContract_.balanceOf(config.crowdsaleAddress, function (error, result) {
    if (error) {
      return;
    }
    var r1 = result.c[0];
    blankTkenContract_.balanceOf(
      "0x21C3cb98F203Ec5332BFDD26C806DB2b3D0fF318",
      function (error2, result2) {
        if (error) {
          return;
        }
        $("#av-token").html(parseInt((result2.c[0] + r1) / 10000000));
      }
    );
  });

  blankTkenContract_.totalSupply(function (error, result) {
    if (error) {
      return;
    }
    $("#total-supply").html(parseInt(result.c[0] / 10000000));
  });
}

elementInit = function () {
  $("#msg").html("Waiting for input");
  $("#msg").css("color", "white");
  $(".bdt-step").hide();
  $(".bdt-input").show();
  // model just exit by close btn
  $("#myModal").modal({
    backdrop: "static",
    keyboard: false
  });
  clearInputs();
  $("#buy-btn").prop("disabled", false);
  $(".confirm-icon").hide();
  $(".loader").hide();
};

metaMaskInit = function (init = true) {
  // Swal.fire({
  //   title: "Under Development",
  //   imageUrl: '../asset/image/chatbots-AI.gif',
  //   footer: ""
  // });
  // return;
  if (init) elementInit();
  enoughFund = false;
  if (typeof web3 === "undefined") {
    Swal.fire({
      type: "error",
      title: "MetaMask is not installed",
      text: "Please install MetaMask from below link",
      footer: '<a href="https://metamask.io">Install MetaMask</a>'
    });
    return;
  }

  web3.eth.getAccounts(function (err, accounts) {
    if (err != null) {
      Swal.fire({
        type: "error",
        title: "Something wrong",
        text: "Check this error: " + err,
        footer: ""
      });
    } else if (accounts.length === 0) {
      Swal.fire({
        type: "info",
        title: "MetaMask is locked",
        text: "Please unlocked MetaMask",
        footer: ""
      });
    }
  });
  if (window.ethereum) {
    window.web3 = new Web3(ethereum);
    try {
      Web3.providers.HttpProvider.prototype.sendAsync =
        Web3.providers.HttpProvider.prototype.send;
      ethereum.enable();
    } catch (error) {
      console.log("User denied account access...");
      return;
    }
  } else if (window.web3) {
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.log("You should consider trying MetaMask!");
    return;
  }

  web3.eth.defaultAccount = web3.eth.accounts[0];

  var crowdsale_contract = web3.eth.contract(abiCrowdsale);
  crowdsaleContract = crowdsale_contract.at(config.crowdsaleAddress);

  var blank_token_contract = web3.eth.contract(abiBlankToken);
  blankTkenContract = blank_token_contract.at(config.blankTokenAddress);

  var stable_token_contract = web3.eth.contract(abiStableToken);
  stableTokenContract = stable_token_contract.at(config.stableTokenAddress);

  var sell_contract = web3.eth.contract(abiSell);
  sellContract = sell_contract.at(config.sellingAddress);

};

// TODO: Fix this function
// it should get the price from smart contract
function getBDTprice(coin) {
  stableTokenBalance(coin);
}

function changeActiveStep(step) {
  $(".step-box").removeClass("active");
  $(".step-box-" + step).addClass("active done");
  $(".step-box-" + step)
    .find(".loader")
    .show();
  $(".step-box-" + (step - 1))
    .find(".loader")
    .hide();
  $(".step-box-" + (step - 1))
    .find(".confirm-icon")
    .show();
}

function checkBalance(balance, coin) {
  crowdsaleContract.price(function (error, result) {
    if (error) {
      return;
    }
    let unitPrice = result.c[0] / 10000;
    let calAmount;
    if (coin == "bdt") {
      let bdt = $("#bdt").val();
      if (!bdt || parseFloat(bdt) <= 0) {
        $("#msg").css("color", "white");
        $("#dai").val("");
        return;
      }
      calAmount = bdt * unitPrice;
      $("#dai").val(calAmount);
    } else {
      let dai = $("#dai").val();
      if (!dai || parseFloat(dai) <= 0) {
        $("#msg").css("color", "white");
        $("#bdt").val("");
        return;
      }
      calAmount = dai / unitPrice;
      $("#bdt").val(calAmount);
    }
    if (balance < calAmount) {
      $("#msg").css("color", "red");
      $("#msg").html("INSUFFICIENT DAI BALANCE");
      enoughFund = false;
    } else {
      $("#msg").css("color", "green");
      $("#msg").html("ENOUGH DAI BALANCE");
      enoughFund = true;
    }
  });
}

function stableTokenBalance(coin) {
  stableTokenContract.balanceOf(web3.eth.defaultAccount, function (
    error,
    result
  ) {
    if (error) {
      return;
    }
    checkBalance(result.c[0] / 10000, coin);
  });
}

function buy() {
  if (parseInt($("#av-token").html()) <= 0) {
    Swal.fire({
      type: "error",
      title: "NOT ENOUGH TOKEN FOR BUYING",
      text: "Please Try Again In Next 10 Minutes",
      footer: ""
    });
    return;
  }
  val = $("#bdt").val();
  if (val < 1 || val > 10000) {
    Swal.fire({
      type: "error",
      title: "incorect value",
      text: "Your value should between 1 - 10000",
      footer: ""
    });
    return;
  }
  if (!enoughFund) {
    Swal.fire({
      type: "error",
      title: "Your stable coin balance is not enough",
      text: "Please recharge your account and try again",
      footer: ""
    });
    return;
  }

  $(".bdt-input").hide();
  $(".bdt-step").show();
  changeActiveStep(1);

  let dei = parseFloat($("#dai").val()) * 10 ** 18;
  stableTokenContract.approve.sendTransaction(config.crowdsaleAddress, dei, function (
    error,
    result
  ) {
    if (error) {
      console.log(error);
      Swal.fire({
        type: "error",
        title: "Something wrong",
        text: "Error message: " + String(error),
        footer: ""
      });
      return;
    }
    checkApproveResult(result, buyConfrim);
  });
  $("#buy-btn").prop("disabled", true);
}

function checkTX(hash, type = 'buy') {
  changeActiveStep(4);
  web3.eth.getTransactionReceipt(hash, function (error, result) {
    if (error) {
      console.error(error);
      return;
    }
    if (result == null) {
      setTimeout(function () {
        checkTX(hash, type);
      }, 5000);
      return;
    }
    changeActiveStep(5);
    let msg = type == 'buy' ? 'Purchase' : 'Sell'
    Swal.fire(
      msg + " Done Successfully",
      "Please Check Your Account",
      "success"
    );
  });
}

Timer = (function () {
  var self = {};
  self.second = 0;
  self.counter = null;
  self.element = null;

  self.start = function (id) {
    self.element = id;
    self.second = self.minute = self.hour = 0;
    self.counter = setInterval(function () {
      self.second++;
      let minute = 0;
      let second = 0;
      if (self.second < 60) {
        second = self.second;
        minute = hour = 0;
      } else {
        minute = parseInt(self.second / 60);
        second = parseInt(self.second - minute * 60);
        let hour = parseInt(self.second / 3600);
      }
      $("#" + id).html(hour + ":" + minute + ":" + second);
    }, 1000);
  };

  self.stop = function () {
    clearInterval(self.counter);
    self.second = 0;
    $("#" + self.element).html("");
  };

  return self;
})();

function buyConfrim() {
  let ref = $(".ref-box").val();
  crowdsaleContract.buy.sendTransaction(ref, function (error, result) {
    if (error) {
      console.log(error);
      return;
    }
    checkTX(result, 'buy');
  });
}

function checkApproveResult(hash, cb) {
  changeActiveStep(2);
  web3.eth.getTransactionReceipt(hash, function (error, result) {
    if (error) {
      console.error(error);
      return;
    }
    if (result == null) {
      setTimeout(function () {
        checkApproveResult(hash, cb);
      }, 5000);
      return;
    }
    changeActiveStep(3);
    cb();
  });
}

/**************************
*************************
Selling Script
*************************
**************************/


var BDTPrice = 0;
var allowToSell = false;

function sellInit() {
  metaMaskInit(false);
  $("#sellModal").modal({
    backdrop: "static",
    keyboard: false
  });
  $("#sellMsg").html("Waiting for input");
  $("#sellMsg").css("color", "white");
  $(".bdt-step").hide();
  $(".bdt-input").show();
  $("#sell-btn").prop("disabled", false);
  $(".confirm-icon").hide();
  $(".loader").hide();
}


function calculateDAI() {
  let bdt = $("#sellBdt").val();
  let blackList = [null, "", " ", "0", "0.", "0.", "0.0"];
  if (blackList.indexOf(bdt) != -1) {
    $("#sellMsg").html(" ");
    return;
  }
  crowdsaleContract.price(function (error, result) {
    if (error) {
      return;
    }
    let unitPrice = (result.c[0] - 1000) / 10000;
    let dai = unitPrice * bdt;

    blankTkenContract.balanceOf(web3.eth.defaultAccount, function (error, result) {
      if (error) {
        return;
      }
      let balance = result.c[0] / 10000;
      if (bdt > balance) {
        allowToSell = false;
        $("#sellMsg").css("color", "red");
        $("#sellMsg").html("Not Enough BDT");
      } else {
        allowToSell = true;
        $("#sellMsg").css("color", "black");
        $("#sellMsg").html("You Will Recive " + dai + " DAI");
      }
    });

  });
}


function sell() {
  if (!allowToSell) {
    Swal.fire({
      type: "error",
      title: "Invalid Request",
      text: "You Haven't Enough BDT",
    });
    return;
  };
  $("#sellMsg").html("Waiting for input");
  $("#sellMsg").css("color", "white");
  let bdt = parseFloat($("#sellBdt").val());
  if (bdt < 1 || bdt > 1000 || isNaN(bdt)) {
    Swal.fire({
      type: "error",
      title: "incorect value",
      text: "Your value should between 1 - 1000",
    });
    return;
  }
  $(".bdt-input").hide();
  $(".bdt-step").show();
  changeActiveStep(1);

  bdt = bdt * 10 ** 18;
  blankTkenContract.approve.sendTransaction(config.sellingAddress, bdt, function (
    error,
    result
  ) {
    if (error) {
      console.log(error);
      Swal.fire({
        type: "error",
        title: "Something wrong",
        text: "Error message: " + String(error.message),
      });
      return;
    }
    checkApproveResult(result, sellConfrim);
  });
  $("#sell-btn").prop("disabled", true);
}


function sellConfrim() {
  sellContract.sell(function (error, result) {
    if (error) {
      console.log(error);
      return;
    }
    checkTX(result, 'sell');
  });
}