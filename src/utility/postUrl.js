import axios from "axios";
import { error } from "./notification";
import { SUB_SITE } from ".";

export default function postUrl(sitemode,
  url,
  data,
  done = (f) => f,
  logout = null,
  err = f=>f,
) {
  axios
    .post( SUB_SITE[sitemode?sitemode: "betwallet"] + url, data)
    .then((res) => done(res.data))
    .catch((e) => {
      if ((e.response || {}).status === 401) logout && logout();
      else if (e?.response?.data) return err(e?.response?.data);
      else error(e);
    });

}
