import {useAccount, usePublicClient, useSignMessage} from "wagmi";
import {prepareMessage} from "siwe";

const {address, chain} = useAccount();
const {signMessageAsync} = useSignMessage();

/*
* Array of networks currently supported by the idLinkChain contract.  
*/
const networks = [
  { networkAbbreviation: "x", networkName: "X (Twitter)" },
  { networkAbbreviation: "dc", networkName: "Discord" },
  { networkAbbreviation: "tg", networkName: "Telegram" },
  { networkAbbreviation: "insta", networkName: "Instagram" },
  { networkAbbreviation: "in", networkName: "LinkedIn" },
  { networkAbbreviation: "git", networkName: "Github" },
  { networkAbbreviation: "tw", networkName: "Twitch" },
  { networkAbbreviation: "yt", networkName: "YouTube" },
  { networkAbbreviation: "tt", networkName: "TikTok" },
  { networkAbbreviation: "sm", networkName: "Signal" },
  { networkAbbreviation: "web", networkName: "Website" },
  { networkAbbreviation: "email", networkName: "Email" },
  { networkAbbreviation: "ph", networkName: "Phone" },
  { networkAbbreviation: "sol", networkName: "Solana" },
  { networkAbbreviation: "btc", networkName: "Bitcoin" },
  { networkAbbreviation: "far", networkName: "Farcaster / Warpcast" },
];

/*
* Function to check if an address is a smart wallet.  Will not work for smart 
* wallets that have not been deployed (have no transactions).  This should not
* be an issue in the case of identity verification.
*/
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

/*
* Function to generate signature for verifying a concealed identity for a non-smart wallet.
*/
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
}

/*
* Example logic for verifying a concealed identity.  This portion of the logic should 
* be implemented on the client side.
*/
const userConcealedFunction = async () => {
  const isSmartWallet = await isContract();
  if (isSmartWallet) {
    /*
    * REQUEST ACTUAL IDENTITY, NETWORK ABBREVIATION AND PIN FROM USER
    *
    * For user friendliness, you may want to use the server side getIdentification
    * in advance in order to pre-populate available networkAbbreviations.
    *
    * Identities are always stored without leading or trailing white space, and without
    * symbols such as "@" or "#".  For example, an X (Twitter) identity should be sent
    * as "idlinkchain," not "@idlinkchain".  Symbols within an identity are allowed, for
    * example, in email addresses.
    * 
    * Now call your server: 
    * verifydentity(userAddress, chain.id, identity, networkAbbreviation, pin, "", true) 
    */
    } else {
    /*
    * REQUEST IDENTITY AND NETWORK ABBREVIATION, THEN SIGN MESSAGE
    *
    * For user friendliness, you may want to use the server side getIdentification
    * in advance in order to pre-populate available networkAbbreviations.
    * 
    * Identities are always stored without leading or trailing white space, and without
    * symbols such as "@" or "#".  For example, an X (Twitter) identity should be sent
    * as "idlinkchain," not "@idlinkchain".  Symbols within an identity are allowed, for
    * example, in email addresses.
    *
    */
    const signature = await generateSignature(identity, networkAbbreviation, signMessageAsync);
    /* Now call your server:
    verifyIdentity(address, chain.id, identity, networkAbbreviation, "", signature, true)
    */ 
  }
};

/*
* Reference logic for sigin in with Ethereum (or any EVM compatible wallet).
*/
const signInWithEth = async () => {
  try {
    const domain = "yourdomain.com";
    const origin = "https://yourdomain.com";
    const nonce = "12345"; // Get one time use nonce from server for extra security
    const siginMessage = `Sign in to your ${domain} account.  Signing this message will not cost you anything.  This message is for authentication purposes only.  You can ignore this message if you did not initiate the request to sign in.`;
    
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

    const signature = await signMessageAsync({message: message});
  
    const headers = {};
  
    headers["Content-Type"] = "application/json";
    const response = await fetch(`${baseUrl}ethSignIn`, {
              method: 'POST',
              headers: headers,
              body: JSON.stringify({message, signature})
          });
    if (!response.ok) {
      
      if (response.status === 401) {
        throw new Error("There was a problem trying to sign in with your wallet.");
      } else {
        throw new Error("There was a problem trying to sign in with your wallet.");
      }
    }

    const data = await response.json();
    if (data.token) {
      await signInWithCustomToken(auth(), data.token);
    }
  } catch (e) {
    toast.error("There was a problem trying to sign in with your wallet.")
    setEthSignIn(false);
  }
}
