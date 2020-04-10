const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const Eth = require('ethjs');
const Web3 = require('web3');
const Web3Modal = require('web3modal').default;
const WalletConnectProvider = require("@walletconnect/web3-provider").default;

window.Eth = Eth
const fs = require('fs')
const terms = fs.readFileSync(__dirname + '/terms.txt').toString()
const getAccount = async () => {
  if (window.web3 && window.web3.currentProvider && web3.currentProvider.accounts &&  web3.currentProvider.accounts.length) {
    return web3.currentProvider.accounts[0].toLowerCase();
  } else {
    await connect();
    return getAccount();
  }
}

const initWeb3Modal = async () => {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: "d27b830b300f401f8a4629908c9b4ad7" // required
      }
    }
  };
  
  const web3Modal = new Web3Modal({
    network: "mainnet", // optional
    cacheProvider: true, // optional
    providerOptions // required
  });
  
  const provider = await web3Modal.connect();
  console.log('PROVIDER:', provider);
  window.web3 = new Web3(provider);
  window.web3ModalReady = true;
  console.log('PROVIDER:', window.web3);
  connect();
};

connectButton.addEventListener('click', async () => {
  initWeb3Modal();
})

const connect = async () => {
  if (window.web3ModalReady && window.web3 && window.web3.currentProvider) {
    const accounts = await window.web3.currentProvider.enable();
    console.log('connect :: accounts', accounts);
  } else {
    initWeb3Modal();
  }
}

ethSignButton.addEventListener('click', async (event) => {
  event.preventDefault()
  const msg = '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0'
  
  const from = await getAccount();
  console.log('ethSignButton', { from });
  web3.eth.sign(msg, from, (err, result) => {
    if (err) return console.error(err)
    alert('SIGNED:\n' + result);
  })
})

personalSignButton.addEventListener('click', async (event) => {
  event.preventDefault()
  const text = terms
  const msg = ethUtil.bufferToHex(new Buffer(text, 'utf8'))
  // const msg = '0x1' // hexEncode(text)
  console.log(msg)
  const from = await getAccount();
  

  /*  web3.personal.sign not yet implemented!!!
   *  We're going to have to assemble the tx manually!
   *  This is what it would probably look like, though:
    web3.personal.sign(msg, from) (err, result) => {
      if (err) return console.error(err)
      console.log('PERSONAL SIGNED:' + result)
    })
  */

   console.log('CLICKED, SENDING PERSONAL SIGN REQ')
  const params = [msg, from]
  const method = 'personal_sign'

  web3.currentProvider.sendAsync({
    method,
    params,
    from,
  }, (err, result) => {
    if (err) return console.error(err)
    if (result.error) return console.error(result.error)
    console.log('PERSONAL SIGNED:' + JSON.stringify(result.result))

    console.log('recovering...')
    const msgParams = { data: msg }
    msgParams.sig = result.result
    console.dir({ msgParams })
    const recovered = sigUtil.recoverPersonalSignature(msgParams)
    console.dir({ recovered })

    if (recovered === from ) {
      console.log('SigUtil Successfully verified signer as ' + from)
      alert('SigUtil Successfully verified signer as ' + from)
    } else {
      console.dir(recovered)
      console.log('SigUtil Failed to verify signer when comparing ' + recovered.result + ' to ' + from)
      console.log('Failed, comparing %s to %s', recovered, from)
    }


    /*
    method = 'personal_ecRecover'
    const params = [msg, result.result]
    web3.currentProvider.sendAsync({
      method,
      params,
      from,
    }, function (err, recovered) {
      console.dir({ err, recovered })
      if (err) return console.error(err)
      if (result.error) return console.error(result.error)

      if (result.result === from ) {
        console.log('Successfully verified signer as ' + from)
      } else {
        console.log('Failed to verify signer when comparing ' + result.result + ' to ' + from)
      }

    })
    */
  })

})


personalRecoverTest.addEventListener('click', async (event) => {
  event.preventDefault()
  const text = 'hello!'
  const msg = ethUtil.bufferToHex(new Buffer(text, 'utf8'))
  // const msg = '0x1' // hexEncode(text)
  console.log(msg)
  const from = await getAccount();
  

  /*  web3.personal.sign not yet implemented!!!
   *  We're going to have to assemble the tx manually!
   *  This is what it would probably look like, though:
    web3.personal.sign(msg, from) (err, result) => {
      if (err) return console.error(err)
      console.log('PERSONAL SIGNED:' + result)
    })
  */

   console.log('CLICKED, SENDING PERSONAL SIGN REQ')
  const params = [msg, from]
  let method = 'personal_sign';

  web3.currentProvider.sendAsync({
    method,
    params,
    from,
  }, (err, result) => {
    if (err) return console.error(err)
    if (result.error) return console.error(result.error)
    console.log('PERSONAL SIGNED:' + JSON.stringify(result.result))

    console.log('recovering...')
    const msgParams = { data: msg }
    msgParams.sig = result.result

    method = 'personal_ecRecover'
    const params = [msg, result.result]
    web3.currentProvider.sendAsync({
      method,
      params,
      from,
    }, (err, result) => {
      const recovered = result.result
      console.log('ec recover called back:')
      console.dir({ err, recovered })
      if (err) return console.error(err)
      if (result.error) return console.error(result.error)


      if (recovered === from ) {
        alert('Successfully ecRecovered signer as ' + from)
      } else {
        console.log('Failed to verify signer when comparing ' + result + ' to ' + from)
      }

    })
  })

})

ethjsPersonalSignButton.addEventListener('click', async (event) => {
  event.preventDefault()
  const text = terms
  const msg = ethUtil.bufferToHex(new Buffer(text, 'utf8'))
  const from = await getAccount();
  

  console.log('CLICKED, SENDING PERSONAL SIGN REQ')
  const params = [from, msg]

  // Now with Eth.js
  const eth = new Eth(web3.currentProvider)

  eth.personal_sign(msg, from)
  .then((signed) => {
    console.log('Signed!  Result is: ', signed)
    console.log('Recovering...')

    return eth.personal_ecRecover(msg, signed)
  })
  .then((recovered) => {

    if (recovered === from) {
      alert('Ethjs recovered the message signer!')
    } else {
      console.log('Ethjs failed to recover the message signer!')
      console.dir({ recovered })
    }
  })
})


signTypedDataButton.addEventListener('click', async (event) => {
  event.preventDefault()

  const msgParams = [
    {
      type: 'string',
      name: 'Message',
      value: 'Hi, Alice!'
    },
    {
      type: 'uint32',
      name: 'A number',
      value: '1337'
    }
  ]

  const from = await getAccount();
  

  /*  web3.eth.signTypedData not yet implemented!!!
   *  We're going to have to assemble the tx manually!
   *  This is what it would probably look like, though:
    web3.eth.signTypedData(msg, from) (err, result) => {
      if (err) return console.error(err)
      console.log('PERSONAL SIGNED:' + result)
    })
  */

   console.log('CLICKED, SENDING eth_signTypedData SIGN REQ')
  const params = [msgParams, from]
  console.dir(params)
  const method = 'eth_signTypedData'

  web3.currentProvider.sendAsync({
    method,
    params,
    from,
  }, (err, result) => {
    if (err) return console.dir(err)
    if (result.error) {
      alert(result.error.message)
    }
    if (result.error) return console.error('ERROR', result)
    console.log('eth_signTypedData signed:' + JSON.stringify(result.result))

    const recovered = sigUtil.recoverTypedSignatureLegacy({ data: msgParams, sig: result.result })

    if (ethUtil.toChecksumAddress(recovered) === ethUtil.toChecksumAddress(from)) {
      alert('Successfully ecRecovered signer as ' + from)
    } else {
      alert('Failed to verify signer when comparing ' + result + ' to ' + from)
    }

  })

})

signTypedDataV3Button.addEventListener('click', async (event) => {
  event.preventDefault()
  
 
    const msgParams = JSON.stringify({types:{
      EIP712Domain:[
        {name:"name",type:"string"},
        {name:"version",type:"string"},
        {name:"chainId",type:"uint256"},
        {name:"verifyingContract",type:"address"}
      ],
      Person:[
        {name:"name",type:"string"},
        {name:"wallet",type:"address"}
      ],
      Mail:[
        {name:"from",type:"Person"},
        {name:"to",type:"Person"},
        {name:"contents",type:"string"}
      ]
    },
    primaryType:"Mail",
    domain:{name:"Ether Mail",version:"1",chainId:1,verifyingContract:"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"},
    message:{
      from:{name:"Cow",wallet:"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"},
      to:{name:"Bob",wallet:"0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"},
      contents:"Hello, Bob!"}
    })
  
      
  
    const from = await getAccount();
    console.log('CLICKED, SENDING eth_signTypedData_v3 REQ', 'from', from, msgParams)
    const params = [msgParams, from]
    console.dir(params)
    const method = 'eth_signTypedData_v3'
  
    web3.currentProvider.sendAsync({
      method,
      params,
      from,
    }, (err, result) => {
      if (err) return console.dir(err)
      if (result.error) {
        alert(result.error.message)
      }
      if (result.error) return console.error('ERROR', result)
      console.log('TYPED SIGNED:' + JSON.stringify(result.result))
  
      const recovered = sigUtil.recoverTypedSignature({ data: JSON.parse(msgParams), sig: result.result })
  
      if (ethUtil.toChecksumAddress(recovered) === ethUtil.toChecksumAddress(from)) {
        alert('Successfully ecRecovered signer as ' + from)
      } else {
        alert('Failed to verify signer when comparing ' + result + ' to ' + from)
      }
  
    })
})

signTypedDataV4Button.addEventListener('click', async (event) => {
  event.preventDefault()

  const msgParams = JSON.stringify({
    domain: {
      chainId: 1,
      name: 'Ether Mail',
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      version: '1'
    },
    message: {
      contents: 'Hello, Bob!',
      from: {
        name: 'Cow',
        wallets: [
          '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF'
        ]
      },
      to: [
        {
          name: 'Bob',
          wallets: [
            '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
            '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
            '0xB0B0b0b0b0b0B000000000000000000000000000'
          ]
        }
      ]
    },
    primaryType: 'Mail',
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      Group: [{ name: 'name', type: 'string' }, { name: 'members', type: 'Person[]' }],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person[]' },
        { name: 'contents', type: 'string' }
      ],
      Person: [{ name: 'name', type: 'string' }, { name: 'wallets', type: 'address[]' }]
    }
  });

  const from = await getAccount();

  const params = [msgParams, from]
  const method = 'eth_signTypedData_v4'

  console.log('CLICKED, SENDING eth_signTypedData_v4 REQ', 'from', from, msgParams)


  web3.currentProvider.sendAsync({
    method,
    params,
    from,
  }, (err, result) => {
    if (err) return console.dir(err)
    if (result.error) {
      alert(result.error.message)
    }
    if (result.error) return console.error('ERROR', result)
    console.log('TYPED SIGNED:' + JSON.stringify(result.result))

    const recovered = sigUtil.recoverTypedSignature_v4({ data: JSON.parse(msgParams), sig: result.result })

    if (ethUtil.toChecksumAddress(recovered) === ethUtil.toChecksumAddress(from)) {
      alert('Successfully recovered signer as ' + from)
    } else {
      alert('Failed to verify signer when comparing ' + result + ' to ' + from)
    }

  })

})

ethjsSignTypedDataButton.addEventListener('click', async (event) => {
  event.preventDefault()

  const msgParams = [
    {
      type: 'string',
      name: 'Message',
      value: 'Hi, Alice!'
    },
    {
      type: 'uint32',
      name: 'A number',
      value: '1337'
    }
  ]

  const from = await getAccount();
  

  console.log('CLICKED, SENDING PERSONAL SIGN REQ')
  const params = [msgParams, from]

  const eth = new Eth(web3.currentProvider)

  eth.signTypedData(msgParams, from)
  .then((signed) => {
    console.log('Signed!  Result is: ', signed)
    console.log('Recovering...')

    const recovered = sigUtil.recoverTypedSignature({ data: msgParams, sig: signed })

    if (ethUtil.toChecksumAddress(recovered) === ethUtil.toChecksumAddress(from)) {
      alert('Successfully ecRecovered signer as ' + from)
    } else {
      alert('Failed to verify signer when comparing ' + signed + ' to ' + from)
    }

  })
})
