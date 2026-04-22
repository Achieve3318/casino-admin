import moment from "moment-timezone";

export const SITE_MODE_TIMEZONES = {
    brazil: "America/Sao_Paulo",
    grupo25: "America/Sao_Paulo",
    mx: "America/Mexico_City",
    taka: "Asia/Dhaka",
    ghs: "Africa/Accra",
};

const getPersistedSiteMode = () => {
    if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem("nyjas-site-mode");
        if (stored) {
            return stored;
        }
    }
    return process.env.REACT_APP_SITE_MODE || "betwallet";
};

export const getTimezoneForSiteMode = (mode) =>
    SITE_MODE_TIMEZONES[mode] || "UTC";

export const dateFormat = (value, siteMode) => {
    const tz = getTimezoneForSiteMode(siteMode || getPersistedSiteMode());
    return moment(value).tz(tz).format("YYYY/MM/DD HH:mm:ss");
};
