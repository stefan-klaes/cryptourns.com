import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Cryptourns",
  projectId: "YOUR_PROJECT_ID",
  chains: [sepolia],
  /* transports: {
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/...'),
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/...'),
  }, */
  ssr: true, // If your dApp uses server side rendering (SSR)
});
