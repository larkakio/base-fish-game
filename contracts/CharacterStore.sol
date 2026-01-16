// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CharacterStore
 * @dev ERC-1155 contract for Fishdom character NFTs on Base Network
 * @notice Allows users to purchase fish characters with ETH
 */
contract CharacterStore is ERC1155, Ownable {
    using Strings for uint256;

    // Character Token IDs
    uint256 public constant ORANGE_FISH = 0;  // Free default
    uint256 public constant GREEN_FISH = 1;   // Common - $1
    uint256 public constant BLUE_FISH = 2;    // Uncommon - $2
    uint256 public constant PURPLE_FISH = 3;  // Rare - $3
    uint256 public constant GOLD_SHARK = 4;   // Legendary - $5

    // Fixed ETH rate: ~0.0004 ETH = $1 USD (adjustable by owner)
    uint256 public ethPerDollar = 0.0004 ether;

    // Character prices in USD (multiplied by 100 for precision)
    mapping(uint256 => uint256) public characterPricesUSD;

    // Track minted characters per user
    mapping(address => mapping(uint256 => bool)) public hasCharacter;

    // Events
    event CharacterPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event EthRateUpdated(uint256 newRate);
    event FreeCharacterClaimed(address indexed user);

    string public name = "Fishdom Characters";
    string public symbol = "FISH";
    string private _baseUri;

    constructor(string memory baseUri) ERC1155(baseUri) Ownable(msg.sender) {
        _baseUri = baseUri;

        // Set character prices in USD cents
        characterPricesUSD[ORANGE_FISH] = 0;    // Free
        characterPricesUSD[GREEN_FISH] = 100;   // $1
        characterPricesUSD[BLUE_FISH] = 200;    // $2
        characterPricesUSD[PURPLE_FISH] = 300;  // $3
        characterPricesUSD[GOLD_SHARK] = 500;   // $5
    }

    /**
     * @dev Get the ETH price for a character
     * @param tokenId The character token ID
     * @return price in wei
     */
    function getCharacterPriceETH(uint256 tokenId) public view returns (uint256) {
        require(tokenId <= GOLD_SHARK, "Invalid character ID");
        return (characterPricesUSD[tokenId] * ethPerDollar) / 100;
    }

    /**
     * @dev Claim the free Orange Fish character
     */
    function claimFreeCharacter() external {
        require(!hasCharacter[msg.sender][ORANGE_FISH], "Already claimed free character");
        
        hasCharacter[msg.sender][ORANGE_FISH] = true;
        _mint(msg.sender, ORANGE_FISH, 1, "");
        
        emit FreeCharacterClaimed(msg.sender);
    }

    /**
     * @dev Purchase a character with ETH
     * @param tokenId The character to purchase
     */
    function buyCharacter(uint256 tokenId) external payable {
        require(tokenId > ORANGE_FISH && tokenId <= GOLD_SHARK, "Invalid character ID");
        require(!hasCharacter[msg.sender][tokenId], "Already owns this character");

        uint256 price = getCharacterPriceETH(tokenId);
        require(msg.value >= price, "Insufficient ETH sent");

        hasCharacter[msg.sender][tokenId] = true;
        _mint(msg.sender, tokenId, 1, "");

        // Refund excess ETH
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        emit CharacterPurchased(msg.sender, tokenId, price);
    }

    /**
     * @dev Batch check which characters a user owns
     * @param user Address to check
     * @return owned Array of booleans for each character
     */
    function getUserCharacters(address user) external view returns (bool[5] memory owned) {
        for (uint256 i = 0; i <= GOLD_SHARK; i++) {
            owned[i] = hasCharacter[user][i];
        }
        return owned;
    }

    /**
     * @dev Update the ETH/USD rate (owner only)
     * @param newRate New rate in wei per dollar
     */
    function updateEthRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Rate must be positive");
        ethPerDollar = newRate;
        emit EthRateUpdated(newRate);
    }

    /**
     * @dev Set base URI for metadata (owner only)
     */
    function setBaseURI(string memory newUri) external onlyOwner {
        _baseUri = newUri;
    }

    /**
     * @dev Override URI function for metadata
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseUri, tokenId.toString(), ".json"));
    }

    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Get all character prices in ETH
     */
    function getAllPricesETH() external view returns (uint256[5] memory prices) {
        for (uint256 i = 0; i <= GOLD_SHARK; i++) {
            prices[i] = getCharacterPriceETH(i);
        }
        return prices;
    }
}
