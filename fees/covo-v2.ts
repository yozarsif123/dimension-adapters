import { Adapter } from "../adapters/types";
import { CHAIN } from "../helpers/chains";
import { request, gql } from "graphql-request";
import type { ChainEndpoints } from "../adapters/types"
import { Chain } from '@defillama/sdk/build/general';
import { getTimestampAtStartOfDayUTC } from "../utils/date";

const endpoints = {
  [CHAIN.POLYGON]: "https://api.thegraph.com/subgraphs/name/defi-techz/covo-v2-2",
}


const methodology = {
  Fees: "Fees collected from open/close position, liquidations, and borrow fee",
  UserFees: "Fees from open/close position, borrow fee, liquidation fees)",
  HoldersRevenue: "40% of all collected fees goes to COVO stakers",
  SupplySideRevenue: "50% of all collected fees goes to USDC Pool Liquidity providers holders",
  Revenue: "Revenue is 40% of all collected fees, which goes to COVO stakers",
  ProtocolRevenue: "Treasury receives 10% of revenue"
}

const graphs = (graphUrls: ChainEndpoints) => {
  return (chain: Chain) => {
    return async (timestamp: number) => {
      const todaysTimestamp = getTimestampAtStartOfDayUTC(timestamp)
      const searchTimestamp = todaysTimestamp

      const graphQuery = gql
      `{
        feeStat(id: "${searchTimestamp}") {
          margin
        }
      }`;

      const graphQuery1 = gql
      `  {
        tradingStat(id: "${searchTimestamp}") {
          liquidatedCollateral
        }
      }`;

      const graphRes = await request(graphUrls[chain], graphQuery);
      const graphRes1 = await request(graphUrls[chain], graphQuery1);

      const dailyFee = (Number(graphRes?.feeStat?.margin || 0)) + Number(graphRes1?.tradingStat?.liquidatedCollateral || 0);
      const finalDailyFee = (dailyFee / 1e6);
      const userFee = (Number(graphRes?.feeStat?.margin || 0)) + Number(graphRes1?.tradingStat?.liquidatedCollateral  || 0)
      const finalUserFee = (userFee / 1e6);


      return {
        timestamp,
        dailyFees: finalDailyFee.toString(),
        dailyUserFees: finalUserFee.toString(),
        dailyRevenue: (finalDailyFee * 0.4).toString(),
        dailyProtocolRevenue: (finalDailyFee * 0.1).toString(),
     //  totalProtocolRevenue: "0",
      //  totalProtocolRevenue: (finalDailyFee * 0.1).toString(),
        dailyHoldersRevenue: (finalDailyFee * 0.4).toString(),
        dailySupplySideRevenue: (finalDailyFee * 0.5).toString(),
      };
    };
  };
};


const adapter: Adapter = {
  adapter: {
    [CHAIN.POLYGON]: {
      fetch: graphs(endpoints)(CHAIN.POLYGON),
      start: async () => 1680070802,
      meta: {
        methodology
      }
    },
  }
}

export default adapter;
