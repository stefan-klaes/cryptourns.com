import { parseAbi } from "viem";

export const erc20TransferAbi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
]);

export const erc721SafeTransferAbi = parseAbi([
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
]);

export const erc1155SafeTransferAbi = parseAbi([
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
]);
