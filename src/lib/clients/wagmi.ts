import { getDefaultConfig } from "@rainbow-me/rainbowkit";

import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";

const { chain } = getCryptournsChainConfig();

export const wagmiConfig = getDefaultConfig({
  appName: "Cryptourns",
  projectId: "YOUR_PROJECT_ID",
  chains: [chain],
  /* transports: {
    [chain.id]: http('https://eth-mainnet.g.alchemy.com/v2/...'),
  }, */
  ssr: true,
});
