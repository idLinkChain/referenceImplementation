import {http, createConfig, readContract, getPublicClient} from "@wagmi/core";
import {arbitrum, base, polygon, mainnet, scroll, bsc} from "@wagmi/core/chains";
import {SiweMessage} from "siwe";
import {readFileSync} from "fs";

// Helper contract addresses on each chain
const helperContract = {
  [arbitrum.id]: "0x01D01dEEa6C2620c4E93725937Ec088A1eAE2A6d",
  [base.id]: "0x01D01dEEa6C2620c4E93725937Ec088A1eAE2A6d",
  [polygon.id]: "0x01D01dEEa6C2620c4E93725937Ec088A1eAE2A6d",
  [mainnet.id]: "0x01D01dEEa6C2620c4E93725937Ec088A1eAE2A6d",
  [scroll.id]: "0x01D01dEEa6C2620c4E93725937Ec088A1eAE2A6d",
  [bsc.id]: "0x01D01dEEa6C2620c4E93725937Ec088A1eAE2A6d",
  };

let abi;

// API Key for transport API (should be stored in environment variable)
const blastKey = "";

// Create config object with chains and transports
const config = createConfig({
  chains: [arbitrum, base, polygon, mainnet, scroll, bsc],
  transports: {
    [arbitrum.id]: http(`https://arbitrum-one.blastapi.io/${blastKey}`),
    [base.id]: http(`https://base-mainnet.blastapi.io/${blastKey}`),
    [polygon.id]: http(`https://polygon-mainnet.blastapi.io/${blastKey}`),
    [mainnet.id]: http(`https://zksync-mainnet.blastapi.io/${blastKey}`),
    [scroll.id]: http(`https://scroll-mainnet.blastapi.io/${blastKey}`),
    [bsc.id]: http(`https://bsc-mainnet.blastapi.io/${blastKey}`),
  },
});

/*
* Loads the idLinkHelper contract ABI.
*/
const getAbi = () => {

  if (abi) {
    return;
  }
  const idLinkHelper = readFileSync("contracts/idLinkHelper.json");
  const idLinkData = JSON.parse(idLinkHelper);
  abi = idLinkData.abi;
};

/*
* Reference implementation for signing in with Ethereum.
*/
const ethSignIn = async (request, response) => {
  const SIWEObject = new SiweMessage(request.body.message);
  const messageAddress = getAddress(SIWEObject.address.toLowerCase());

  const signature = request.body.signature;

  // const {data: message} = await SIWEObject.verify({signature: signature, nonce: nonceDoc.data().nonce});
  const publicClient = getPublicClient(config, {
    chainId: SIWEObject.chainId,
  });

  const valid = await publicClient.verifyMessage({
    address: SIWEObject.address,
    message: SIWEObject.prepareMessage(),
    signature: signature,
  });

  if (!valid) {
    console.log("Invalid signature decode");
    response.status(401).json({message: "Invalid signature"});
  }
  response.status(200).json({address: messageAddress});
};

/*
* Gets the user's identification information from the idLinkHelper contract.
*
* Calls idLinkHelper contract on the specified chain.
* 
* Solidity function:
* prettyPrintIdentities(address user) public view returns (string memory)
*/
const getIdentification = async (userAddress, chainId) => {
  try {
    getAbi();
    try {
      const result = await readContract(config, {
        abi,
        chainId: chainId,
        address: helperContract[chainId],
        functionName: "prettyPrintIdentities",
        args: [userAddress],
      });
      
      const json = JSON.parse(result);

      return json;
    } catch (err) {
      console.log(err);
      
    }
  } catch (err) {
    console.log(err);
    return {complete: true};
  }
};

/*
* Verifies a user's identity.  
* 
* For concealed identities, if the user is using a smart wallet, the user must 
* provide a pin.  The pin can be an empty string if the user chose to store 
* their concealed identity without a ping.  If the user is using a regular wallet, 
* provide a signature generated client side (see userConcealedFunction).   
*
* Calls idLinkHelper contract on the specified chain.
* 
* Solidity function:
*  verifyIdentity(string calldata identity, 
*    string calldata networkAbbreviation, 
*    string memory pin, 
*    bytes calldata signature, 
*    address sender, 
*    bool isObscured) public view returns (string memory)
*/
const verifyIdentity = async (userAddress, chainId, identity, networkAbbreviation, pin, signature, concealed) => {
  try {
    getAbi();
    try {
      const result = await readContract(config, {
        abi,
        chainId: chainId,
        address: helperContract[chainId],
        functionName: "verifyIdentity",
        args: [identity, networkAbbreviation, pin, signature, userAddress, concealed],
      });
      
      if (result === "INVALID") {
        return false;
      } else {
        return true;
      }
    } catch (err) {
      console.log(err);
      
    }
  } catch (err) {
    console.log(err);
    return {complete: true};
  }
}
