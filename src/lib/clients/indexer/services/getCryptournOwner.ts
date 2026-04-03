import { getOwnerOfViem } from "../viem/getOwnerOf";
import { withFallback } from "../withFallback";

export const getCryptournOwner = withFallback(
  "getCryptournOwner",
  getOwnerOfViem,
);
