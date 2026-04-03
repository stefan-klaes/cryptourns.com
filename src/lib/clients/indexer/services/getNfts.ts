import { getNftsAlchemy } from "../alchemy/getNfts";
import { withFallback } from "../withFallback";

export const getNfts = withFallback("getNfts", getNftsAlchemy);
