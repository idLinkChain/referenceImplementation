# idLinkChain referenceImplementation

# idLinkChain Example Code

This repository contains example code for using the `idLinkChain` contract to verify user identities with their Ethereum-compatible wallets. The provided code demonstrates how to interact with the `idLinkChain` contract, check if an address is a smart wallet, generate signatures for identity verification, and sign in with Ethereum.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Checking if an Address is a Smart Wallet](#checking-if-an-address-is-a-smart-wallet)
  - [Generating Signatures for Identity Verification](#generating-signatures-for-identity-verification)
  - [Verifying Concealed Identities](#verifying-concealed-identities)
  - [Signing In with Ethereum](#signing-in-with-ethereum)
  - [Getting User Identification Information](#getting-user-identification-information)
  - [Verifying User Identity](#verifying-user-identity)
- [Helper Contracts](#helper-contracts)
- [Configuration](#configuration)

## Installation

To use this example code, you need to have Node.js installed. Clone the repository and install the dependencies:

```bash
git clone https://github.com/idLinkChain/referenceImplementation.git
cd referenceImplementation
npm install
```

## Usage

### Checking if an Address is a Smart Wallet

The following function checks if an address is a smart wallet. It will not work for smart wallets that have not been deployed (i.e., have no transactions).

```javascript
const isContract = async () => {
  try {
    const provider = usePublicClient();
    const code = await provider.getCode(address);
    return code !== '0x'; // If code is not '0x', the address is a contract
  } catch (error) {
    console.error('Error checking contract:', error);
    return false;
  }
};
```

### Generating Signatures for Identity Verification

The following function generates a signature for verifying a concealed identity for a non-smart wallet.

```javascript
const generateSignature = async (identity, networkAbbreviation, signMessageAsync) => {
  try {
    const result = await signMessageAsync({
      message: `${networkAbbreviation.toLowerCase()}:${identity.toLowerCase()}:${address.toLowerCase()}`
    });
    return result;
  } catch (err) {
    console.log(err);
    return;
  }
};
```

### Verifying Concealed Identities

Example logic for verifying a concealed identity. This portion of the logic should be implemented on the client side.

```javascript
const userConcealedFunction = async () => {
  const isSmartWallet = await isContract();
  if (isSmartWallet) {
    // Request actual identity, network abbreviation, and PIN from user
    // Call your server: verifyIdentity(userAddress, chain.id, identity, networkAbbreviation, pin, "", true)
  } else {
    // Request identity and network abbreviation, then sign message
    const signature = await generateSignature(identity, networkAbbreviation, signMessageAsync);
    // Call your server: verifyIdentity(address, chain.id, identity, networkAbbreviation, "", signature, true)
  }
};
```

### Signing In with Ethereum

Reference logic for signing in with Ethereum (or any EVM compatible wallet).

```javascript
const signInWithEth = async () => {
  try {
    const domain = "yourdomain.com";
    const origin = "https://yourdomain.com";
    const nonce = "12345"; // Get one-time use nonce from server for extra security
    const siginMessage = `Sign in to your ${domain} account. Signing this message will not cost you anything. This message is for authentication purposes only. You can ignore this message if you did not initiate the request to sign in.`;

    const chainId = chain?.id;

    const message = {
      domain: domain,
      address,
      statement: siginMessage,
      uri: origin,
      version: '1',
      chainId: chain.id,
      nonce: nonce,
    };

    const preparedMessage = await prepareMessage(message);

    const signature = await signMessageAsync({ message: message });

    const headers = { "Content-Type": "application/json" };
    const response = await fetch(`${baseUrl}ethSignIn`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ message, signature })
    });

    if (!response.ok) {
      throw new Error("There was a problem trying to sign in with your wallet.");
    }

    const data = await response.json();
    if (data.token) {
      await signInWithCustomToken(auth(), data.token);
    }
  } catch (e) {
    toast.error("There was a problem trying to sign in with your wallet.")
    setEthSignIn(false);
  }
};
```

### Getting User Identification Information

Gets the user's identification information from the `idLinkHelper` contract. Calls the `idLinkHelper` contract on the specified chain.

```javascript
const getIdentification = async (userAddress, chainId) => {
  try {
    getAbi();
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
    return { complete: true };
  }
};
```

### Verifying User Identity

Verifies a user's identity. For concealed identities, if the user is using a smart wallet, the user must provide a PIN. The PIN can be an empty string if the user chose to store their concealed identity without a PIN. If the user is using a regular wallet, provide a signature generated client-side.

Calls the `idLinkHelper` contract on the specified chain.

```javascript
const verifyIdentity = async (userAddress, chainId, identity, networkAbbreviation, pin, signature, concealed) => {
  try {
    getAbi();
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
    return { complete: true };
  }
};
```

## Helper Contracts

The helper contract addresses on each chain are as follows:

```javascript
const helperContract = {
  [arbitrum.id]: "0x01D01dEEa6C2620c4E93725937Ec088A1eAE2A6d",
  [base.id]: "0x01D01dEEa6C2620c4E93725937Ec088A1eAE2A6d",
  [polygon.id]: "0x01D01dEEa6C2620c4E93725937Ec088A1eAE2A6d",
  [mainnet.id]: "0x01D01dEEa6C2620c4E93725937Ec088A1eAE2A6d",
  [scroll.id]: "0x01D01dEEa6C2620c4E93725937Ec088A1eAE2A6d",
  [bsc.id]: "0x01D01dEEa6C2620c4E93725937Ec088A1eAE2A6d",
};
```

## Configuration

Create a configuration object with chains and transports. The API key for the transport API should be stored in an environment variable.

```javascript
const blastKey = "";

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
```

## Loading the idLinkHelper Contract ABI

Loads the `idLinkHelper` contract ABI.

```javascript
let abi;

const getAbi = () => {
  if (abi) {
    return;
  }
  const idLinkHelper = readFileSync("contracts/idLinkHelper.json");
  const idLinkData = JSON.parse(idLinkHelper);
  abi = idLinkData.abi;
};
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes or improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to use this example code as a reference for integrating `idLinkChain` into your own projects. If you encounter any issues or have questions, please open an issue on this repository. Happy coding!