// Compatibility facade for integrations using the original bank store path.
export {
  allBanks as listQuestionBanks,
  bankById as getQuestionBank,
} from "@/lib/platform/model";
