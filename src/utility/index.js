import postUrl from "./postUrl";

const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && (value === "null" || value === "undefined" || value === "")) ||
  JSON.stringify(value) === "[]" ||
  JSON.stringify(value) === "{}";

const isNumber = (value) =>
  !isEmpty(value) && !isNaN(parseFloat(value)) && isFinite(value);

const convert2MK = (num) =>
  isNumber(num)
    ? num >= 1000000
      ? num / 1000000 + "M"
      : num >= 1000
        ? num / 1000 + "K"
        : num
    : num;

const blockedEmail = (username, blockLists) => {
  return blockLists.find((item) => item.username === username) ? <span className="text-red-500">{username}</span> : <span>{username}</span>;
}


const SUB_SITE = {
  betwallet: process.env.REACT_APP_BETWALLET_URL,
  mx: process.env.REACT_APP_MX_URL,
  taka: process.env.REACT_APP_TAKA_URL,
  ghs: process.env.REACT_APP_GHS_URL,
  brazil: process.env.REACT_APP_BRAZIL_URL,
  grupo25: process.env.REACT_APP_GRUPO25_URL,
  cop: process.env.REACT_APP_COP_URL,
}

export { convert2MK, isEmpty, isNumber, postUrl, blockedEmail, SUB_SITE };

