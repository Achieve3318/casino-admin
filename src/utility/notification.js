import { notification } from "antd";

export const error = (err) => {
  if (err && err.response)
    notification.error({
      message: "Error",
      description: (err.response || {}).data?.message,
    });
  else if (err.message)
    notification.error({
      message: "Error",
      description: err.message,
    });
  else
    notification.error({
      message: "Error",
      description: "Server is not running",
    });
};

export const success = (message) => {
  notification.success({ description: message, message: "Success" });
};

export const warning = (message) => {
  notification.warning({ description: message, message: "Warning" });
};
