import { EtherscanLogo } from "./EtherscanLogo";
import { EthereumLogo } from "./EthereumLogo";
import { OpenseaLogo } from "./OpenseaLogo";
import { XLogo } from "./XLogo";

export type { BrandIconProps } from "./types";

export { EtherscanLogo, EthereumLogo, OpenseaLogo, XLogo };

/** Third-party brand marks; use `BrandIcon.ethereum` etc. */
export const BrandIcon = {
  etherscan: EtherscanLogo,
  ethereum: EthereumLogo,
  opensea: OpenseaLogo,
  x: XLogo,
} as const;
