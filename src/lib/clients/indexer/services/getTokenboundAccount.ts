import { getTokenboundAccountViem } from "../viem/getTokenboundAccount";
import { withFallback } from "../withFallback";

export const getTokenboundAccount = withFallback(
  "getTokenboundAccount",
  getTokenboundAccountViem,
);
