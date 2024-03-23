var contract = null;
var account = "";
var provider = null;

fetch("./contracts/SigFlow.json")
  .then((response) => response.json())
  .then((json) => {
    contract = json;
  })
  .catch((err) => {
    setWarning("Contract file not found! " + err.message);
  });

function setProvider(_provider) {
  provider = _provider;
}

function clearProvider() {
  provider = null;
}

function setAccount(accounts) {
  const connectButton = document.getElementById("connectButton");
  connectButton.innerText = `${accounts[0].slice(0, 7)}... connected`;
  account = accounts[0];
  document.getElementById("senderField").value = account;
  const validPeriod = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  document.getElementById("expiredField").value = validPeriod;
}

function clearAccount() {
  const connectButton = document.getElementById("connectButton");
  connectButton.innerText = "Connect Wallet";
  connectButton.disabled = false;
  account = "";
  document.getElementById("senderField").value = "";
  document.getElementById("expiredField").value = "";
}

function setWarning(text) {
  const warningBox = document.getElementById("warningMessageBox");
  warningBox.style.display = "block";
  warningBox.innerText = text;
}

function clearWarning() {
  const warningBox = document.getElementById("warningMessageBox");
  warningBox.style.display = "none";
  warningBox.innerText = "";
}

function resetForm() {
  const valueField = document.getElementById("valueField");
  valueField.value = "";
  valueField.disabled = true;
  const submitButton = document.getElementById("submitButton");
  submitButton.disabled = true;
}

function setResult(value, setter, validPeriod, signature) {
  console.log(value, setter, validPeriod, signature);
  const resultField = document.getElementById("signedResult");
  document.getElementById("signedValue").innerText = value;
  document.getElementById("signedSetter").innerText = setter;
  document.getElementById("signedValidPeriod").innerHTML = validPeriod;
  document.getElementById("signature").innerText = signature;
  resultField.style.display = "block";
}

function clearResult() {
  const resultField = document.getElementById("signedResult");
  resultField.style.display = "none";
}

function reset() {
  clearAccount();
  clearProvider();
  resetForm();
  clearResult();
  clearWarning();
}

function handleAccountsChanged(accounts) {
  if (accounts.length) {
    setAccount(accounts);
  } else {
    reset();
  }
}

async function connectWallet(event) {
  event.preventDefault();
  clearWarning();
  let provider =
    window.ethereum.providerMap?.get("MetaMask") || window.ethereum;
  if (provider) {
    try {
      setProvider(provider);
      let accounts = await provider.request({ method: "eth_requestAccounts" });
      provider.on("accountsChanged", handleAccountsChanged);
      setAccount(accounts);
      const valueField = document.getElementById("valueField");
      valueField.disabled = false;
      const submitButton = document.getElementById("submitButton");
      submitButton.disabled = false;
    } catch (err) {
      setWarning("Error while connecting! " + err.message);
    }
  } else {
    setWarning("Please install Metamask extension.");
  }
}

async function signMessage(event) {
  event.preventDefault();
  clearWarning();

  // struct Order {
  //     uint256 nonce;
  //     address sender;
  //     TradeDirection direction;
  //     uint256 price;
  //     uint256 amount;
  //     uint256 expired;
  //     address baseToken;
  //     address quoteToken;
  // }

  const mock = [
    1, 0x80b5cc0d967f937c49e2152de1b87cd60ed5cf39, 1, 1000000000000000000, 100,
    1648834800, 0x4b20993bc481177ec7e8f571cecae8a9e22c02db,
    0x5b38da6a701c568545dcfcb03fcb875f56beddc4,
  ];
  const nonce = document.getElementById("nonceField").value;
  const sender = document.getElementById("senderField").value;
  const direction = document.getElementById("directionField").value;
  const price = document.getElementById("priceField").value;
  const amount = document.getElementById("amountField").value;
  const expired = document.getElementById("expiredField").value;
  const baseToken = document.getElementById("baseTokenField").value;
  const quoteToken = document.getElementById("quoteToken").value;

  let msgParams = JSON.stringify({
    domain: {
      name: "SigFlowContract",
      version: "1.0",
      chainId: 17000, // Truffle network's chain id
      verifyingContract: "0x0837Ffdb7d8a481CF4E53Be59ae8AE255e70c472", // Address of contract deployed on Truffle network
    },
    message: {
      nonce,
      sender,
      direction,
      price,
      amount,
      expired,
      baseToken,
      quoteToken,
    },
    primaryType: "Order",
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Order: [
        { name: "nonce", type: "uint256" },
        { name: "sender", type: "string" },
        { name: "direction", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "amount", type: "uint256" },
        { name: "expired", type: "uint256" },
        { name: "baseToken", type: "uint256" },
        { name: "quoteToken", type: "uint256" },
      ],
    },
  });
  try {
    const signature = await provider.request({
      method: "eth_signTypedData_v4",
      params: [account, msgParams],
      from: account,
    });
    setResult(amount, sender, expired, signature);
  } catch (err) {
    setWarning("Some error occurred! " + err.message);
  }
}
