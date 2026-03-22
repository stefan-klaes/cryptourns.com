// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**************************************************************************
implement 6551 tokenbound accounts (TBA)
*************************************************************************/
interface IERC6551Registry {
    function createAccount(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external returns (address account);

    function account(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external view returns (address account);
}
interface ERC6551AccountProxy {
    function initialize(address implementation) external;
}

contract CryptoUrns is ERC721 {
    /**************************************************************************
    custom events
    *************************************************************************/

    event LogReferral(
        address indexed referralAddress,
        uint32 mints,
        uint256 amount,
        uint256 timestamp,
        uint8 action
    );
    /* actions:
     * 0: mint via reflink
     * 1: claim earnings
     * 2: contract owner increases claimable eth for ref address
     */

    /**************************************************************************
    private variables
    *************************************************************************/

    // next token id
    uint256 _nextTokenId = 1;

    // referral shares per address for individual referral shares
    mapping(address => uint8) private _individualReferralShares;

    // earnings per address via referral mints
    mapping(address => uint256) private _earnings;

    // whitelisted collections to check if minter is owner of nft
    address[] private _whitelistedCollections;

    // address to validate whitelist signatures
    address _whitelistSigner;

    /**************************************************************************
    public variables
    *************************************************************************/

    // mint price
    uint256 public mintPrice;

    // mint paused
    bool public mintPaused = false;

    // default referral share
    uint8 public defaultReferralShare;

    // total claimable earnings
    uint256 public claimableEarnings = 0;

    // total claimed earnings
    uint256 public claimedEarnings = 0;

    // check if address already has free minted
    mapping(address => bool) public hasFreeMinted;

    // allowed to mint for free if ownes nft from whitelisted collection
    mapping(address => uint32) public freeMintCollections;

    // default base token uri for metadata
    string public baseTokenURI;

    // ERC6551 contract addresses
    address public ERC6551RegistryAddress =
        0x000000006551c19487814612e58FE06813775758;
    address public ERC6551AccountProxyAddress =
        0x55266d75D1a14E4572138116aF39863Ed6596E7F;
    address public ERC6551ImplementationAddress =
        0x41C8f39463A868d3A88af00cd0fe7102F30E44eC;

    /**************************************************************************
    erc721 contract
    *************************************************************************/

    constructor(
        string memory _baseTokenURI,
        uint256 _mintPrice,
        address _whitelistSignerAddress,
        uint8 _defaultReferralShare
    ) ERC721("cryptourns", "urn") {
        baseTokenURI = _baseTokenURI;
        mintPrice = _mintPrice;
        _whitelistSigner = _whitelistSignerAddress;
        defaultReferralShare = _defaultReferralShare;
        _mintWithERC6551(msg.sender);
    }

    /**
     * @dev the owner of token id 1 is the owner of the smart contract
     * > yes, the owner of cryptourn #1 owns the smartcontract
     */
    modifier onlyOwnerOfFirstNFT() {
        require(
            ownerOf(1) == msg.sender,
            "only the owner can call this function. owner of cryptourn #1 is the owner of the project."
        );
        _;
    }

    /**
     * @dev show smart contract owner (owner of cryptourn #1)
     */
    function owner() external view returns (address) {
        return ownerOf(1);
    }

    /**
     * @dev show the tokenbound address for tokenid
     */
    function showTokenboundAccount(
        uint256 tokenId
    ) external view returns (address) {
        return
            IERC6551Registry(ERC6551RegistryAddress).account(
                ERC6551AccountProxyAddress,
                0,
                block.chainid,
                address(this),
                tokenId
            );
    }

    /**
     * @dev Returns the referral share for a given address.
     */
    function getReferralShare(
        address referralAddress
    ) external view returns (uint256) {
        return findReferralShare(referralAddress);
    }

    /**
     * @dev Returns the referral share for a given address.
     */
    function findReferralShare(
        address referralAddress
    ) private view returns (uint256) {
        uint8 individualShare = _individualReferralShares[referralAddress];
        if (individualShare > 0) {
            return individualShare;
        } else {
            return defaultReferralShare;
        }
    }

    /**
     * @dev get whitelisted collections with free mints
     */
    function getFreeMintsForCollections()
        external
        view
        returns (address[] memory collections, uint32[] memory freeMints)
    {
        uint256 length = _whitelistedCollections.length;
        collections = new address[](length);
        freeMints = new uint32[](length);

        for (uint256 i = 0; i < length; i++) {
            address collection = _whitelistedCollections[i];
            collections[i] = collection;
            freeMints[i] = freeMintCollections[collection];
        }

        return (collections, freeMints);
    }

    /**
     * @dev create tokenbound account to let the cryptourn be able to own assets
     */
    function createTokenboundAccount(
        uint256 tokenId
    ) internal returns (address) {
        address accountAddress = IERC6551Registry(ERC6551RegistryAddress)
            .createAccount(
                ERC6551AccountProxyAddress,
                0,
                block.chainid,
                address(this),
                tokenId
            );

        ERC6551AccountProxy(accountAddress).initialize(
            ERC6551ImplementationAddress
        );
        return accountAddress;
    }

    /**
     * @dev mint and create tokenbound account
     */
    function _mintWithERC6551(address mintReceiver) private {
        _safeMint(mintReceiver, _nextTokenId);
        createTokenboundAccount(_nextTokenId);
        _nextTokenId++;
    }

    /**************************************************************************
    now we implement the minting functions:
    there are a total of 4 minting functions to save gas whenever possible

    1. mint: mint of one nft
    2. mintFree: mint of one nft for free if whitelisted
    3. mintFreeCollectionOwner: mint of one nft for free if owner of whitelisted collection
    4. mintReferral: mint of one nft with referral address
    5. mintReferralBulk: mint of multiple nfts with referral address
    6. mintAdvanced: mint of nfts to different receivers
    *************************************************************************/

    /**
     * @dev 1. mint: mint of one nft
     */
    function mint(address mintReceiver) public payable {
        // check if mint is paused
        require(mintPaused == false, "mint is paused.");

        // get mint costs
        uint256 mintCosts = mintPrice;

        // check if msg.value is equal to mint costs
        require(msg.value >= mintCosts, "not enough ether to mint.");

        // mint nft
        _mintWithERC6551(mintReceiver);
    }

    /**
     * @dev 2. mintFree: mint of one nft for free if whitelisted
     */
    function mintFree(address mintReceiver, bytes memory signature) public {
        // check if mint is paused
        require(mintPaused == false, "mint is paused.");

        // check if mint receiver has free minted
        require(
            hasFreeMinted[mintReceiver] == false,
            "you already minted for free. this is only allowed once per address."
        );


        // check if mint receiver is whitelisted
        bytes32 messageHash = keccak256(abi.encodePacked(mintReceiver));

        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        address signer = ECDSA.recover(ethSignedMessageHash, signature);

        require(
            signer == _whitelistSigner,
            "you are not allowed to mint for free. mint receiver is not whitelisted."
        );

        // mint nft
        _mintWithERC6551(mintReceiver);

        // label wallet as has free minted
        hasFreeMinted[mintReceiver] = true;
    }

    /**
     * @dev 3. mintFreeCollectionOwner: mint of one nft for free if owner of whitelisted collection
     */
    function mintFreeCollectionOwner(
        address mintReceiver,
        address whitelistedCollection,
        uint256 tokenId
    ) public {
        // check if mint is paused
        require(mintPaused == false, "mint is paused.");

        // check if mint receiver has free minted
        require(
            hasFreeMinted[mintReceiver] == false,
            "you already minted for free. this is only allowed once per address."
        );

        // check if collection has available free mints
        require(
            freeMintCollections[whitelistedCollection] > 0,
            "there are no available free mints for the selected collection."
        );

        // check if mint receiver is owner of whitelisted collection
        require(
            IERC721(whitelistedCollection).balanceOf(mintReceiver) > 0 ||
                IERC1155(whitelistedCollection).balanceOf(
                    mintReceiver,
                    tokenId
                ) >
                0,
            "mint reveiver does not own a nft of the whitelisted collection."
        );

        // mint nft
        _mintWithERC6551(mintReceiver);

        // label wallet as has free minted
        hasFreeMinted[mintReceiver] = true;

        // decrease collection free mints
        freeMintCollections[whitelistedCollection] -= 1;
    }

    /**
     * @dev 4. mintReferral: mint of one nft with referral address
     */
    function mintReferral(
        address mintReceiver,
        address referralAddress
    ) public payable {
        // check if mint is paused
        require(mintPaused == false, "mint is paused.");

        // get mint costs
        uint256 mintCosts = mintPrice;

        // check if msg.value is equal to mint costs
        require(msg.value >= mintCosts, "not enough ether to mint.");

        // mint nft
        _mintWithERC6551(mintReceiver);

        // if a referral address is not minter address
        if (referralAddress != msg.sender) {
            // calculate referral share
            uint256 referralShare = (mintCosts *
                findReferralShare(referralAddress)) / 100;

            // add referral share to earnings
            _earnings[referralAddress] += referralShare;
            claimableEarnings += referralShare;

            // log referral
            emit LogReferral(
                referralAddress,
                1,
                referralShare,
                block.timestamp,
                0
            );
        }
    }

    /**
     * @dev 5. mintReferralBulk: mint of multiple nfts with referral address
     */
    function mintBulk(address[] memory mintReceivers) public payable {
        // check if mint is paused
        require(mintPaused == false, "mint is paused.");

        // amount to mint in total
        uint32 qty = uint32(mintReceivers.length);

        // check if its a bulk mint
        require(
            qty > 1,
            "this is a bulk mint function. please mint more than 1 nft or use mint instead."
        );

        // get mint costs
        uint256 mintCosts = mintPrice * qty;

        // check if msg.value is equal to mint costs
        require(msg.value >= mintCosts, "not enough ether to mint.");

        for (uint32 i = 0; i < qty; i++) {
            // mint nft
            _mintWithERC6551(mintReceivers[i]);
        }
    }

    /**
     * @dev 6. mintAdvanced: mint of nfts to different receivers
     */
    function mintAdvanced(
        address[] memory mintReceivers,
        address referralAddress
    ) public payable {
        // check if mint is paused
        require(mintPaused == false, "mint is paused.");

        // amount to mint in total
        uint32 qty = uint32(mintReceivers.length);

        // get mint costs
        uint256 mintCosts = mintPrice * qty;

        // check if user has enough ether to mint
        require(msg.value >= mintCosts, "not enough ether to mint.");

        for (uint256 i = 0; i < qty; i++) {
            // mint nft
            _mintWithERC6551(mintReceivers[i]);
        }

        // if a referral address is not minter address
        if (referralAddress != msg.sender) {
            // calculate referral share
            uint256 referralShare = (mintCosts *
                findReferralShare(referralAddress)) / 100;

            // add referral share to earnings
            _earnings[referralAddress] += referralShare;
            claimableEarnings += referralShare;

            // log referral
            emit LogReferral(
                referralAddress,
                qty,
                referralShare,
                block.timestamp,
                0
            );
        }
    }

    /**
     * @dev buy free mints for collection
     */
    function buyFreeMintForCollection(
        address collectionAddress,
        bytes memory signature,
        uint32 freeMints
    ) public payable {
        // needs to be minimum 10 freeMints
        require(freeMints >= 10, "minimum 10 free mints nedded.");

        // check if collection is verified via website
        bytes32 messageHash = keccak256(abi.encodePacked(collectionAddress));

        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        address signer = ECDSA.recover(ethSignedMessageHash, signature);

        require(
            signer == _whitelistSigner,
            "Invalid signature. Buy free mints via our website."
        );

        // discount
        uint8 discountPrice = 75;

        if (freeMints > 100) {
            discountPrice = 60;
        } else if (freeMints > 1000) {
            discountPrice = 34;
        }

        uint256 costs = (freeMints * mintPrice * discountPrice) / 100;

        // check if msg.value is equal to costs
        require(msg.value >= costs, "not enough ether to buy free mints.");

        // increase free mints
        freeMintCollections[collectionAddress] += freeMints;
    }

    /**************************************************************************
    functions available for everyone
    *************************************************************************/

    /**
     * @dev view total supply
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @dev claim referral earnings
     */
    function claimEarnings(address receiver) public {
        uint256 amount = _earnings[msg.sender];
        require(amount > 0, "nothing to claim.");
        _earnings[msg.sender] = 0;
        claimableEarnings -= amount;
        claimedEarnings += amount;
        emit LogReferral(msg.sender, 0, amount, block.timestamp, 1);
        payable(receiver).transfer(amount);
    }

    /**
     * @dev get total claimable earnings for wallet
     */
    function claimableEarningsFor(
        address refferalWallet
    ) public view returns (uint256) {
        return _earnings[refferalWallet];
    }

    /**
     * @dev get withdrawable balance for the owner of smart contract
     */
    function withdrawableBalance() public view returns (uint256) {
        return address(this).balance - claimableEarnings;
    }

    /**************************************************************************
    functions available only for the owner
    *************************************************************************/

    /**
     * @dev airdrop cryptourns
     */
    function airdropTokens(
        address[] memory addresses
    ) public onlyOwnerOfFirstNFT {
        for (uint32 i = 0; i < addresses.length; i++) {
            _mintWithERC6551(addresses[i]);
        }
    }

    /**
     * @dev set the base URI for token metadata.
     */
    function setBaseTokenURI(string memory baseURI) public onlyOwnerOfFirstNFT {
        baseTokenURI = baseURI;
    }

    /**
     * @dev change whitelist signer address
     */
    function setWhitelistSigner(address newSigner) public onlyOwnerOfFirstNFT {
        _whitelistSigner = newSigner;
    }

    /**
     * @dev toogle mint pause or active
     */
    function toggleMintPaused() public onlyOwnerOfFirstNFT {
        mintPaused = !mintPaused;
    }

    /**
     * @dev set mint price
     */
    function setMintPrice(uint256 price) public onlyOwnerOfFirstNFT {
        mintPrice = price;
    }

    /**
     * @dev set the referral share for a given address.
     */
    function setReferralShare(
        address referralAddress,
        uint8 share
    ) public onlyOwnerOfFirstNFT {
        _individualReferralShares[referralAddress] = share;
    }

    /**
     * @dev remove the referral share for a given address.
     */
    function removeReferralShare(
        address referralAddress
    ) public onlyOwnerOfFirstNFT {
        delete _individualReferralShares[referralAddress];
    }

    /**
     * @dev set the default referral share.
     */
    function setDefaultReferralShare(uint8 share) public onlyOwnerOfFirstNFT {
        // require share between 0 and 100
        require(share >= 0 && share <= 100, "share must be between 0 and 100.");
        defaultReferralShare = share;
    }

    /**
     * @dev add collection where owners are allowed to mint for free
     */
    function FreeMintCollectionAdd(
        address whitelistedCollection,
        uint8 freeMints
    ) public onlyOwnerOfFirstNFT {
        freeMintCollections[whitelistedCollection] += freeMints;
        _whitelistedCollections.push(whitelistedCollection);
    }

    /**
     * @dev Withdraw ether from this contract to other wallet
     */
    function withdrawTo(
        address receiverAddress,
        uint256 amount
    ) public onlyOwnerOfFirstNFT {
        // max claimable amount is contract balance minus claimable earnings
        uint256 withdrawable = withdrawableBalance();
        require(withdrawable > 0, "no ether to withdraw.");
        require(amount <= withdrawable, "amount to withdraw is too high.");
        payable(receiverAddress).transfer(amount);
    }

    /**
     * @dev add earnings to a referrer wallet
     */
    function addEarningsTo(
        address referralAddress,
        uint256 amount
    ) public onlyOwnerOfFirstNFT {
        // max claimable amount is contract balance minus claimable earnings
        uint256 withdrawable = withdrawableBalance();
        require(withdrawable > amount, "not enough ether to add.");
        emit LogReferral(referralAddress, 0, amount, block.timestamp, 2);
        _earnings[referralAddress] += amount;
        claimableEarnings += amount;
    }
}