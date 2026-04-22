import axios from "axios";
import { error } from "./notification";

export default function postUrl2Pro(
  url,
  data,
  done = (f) => f,
  logout = null,
  err = f=>f,
) {
  axios
    .post(process.env.REACT_APP_PROVIDER_URL + url, data)
    .then((res) => done(res.data))
    .catch((e) => {
      console.log(e);
      
      if ((e.response || {}).status === 401) logout && logout();
      else if (e?.response?.data) return err(e?.response?.data);
      else error(e);
    });
}
