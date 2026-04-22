import { Tooltip } from "antd";
import React, { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";

export const TruncateMiddle = ({ text, maxLength = 16, showTooltip }) => {
  const [copied, setCopied] = useState(false);
  const handleCopyButton = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  if (!text) return "No Address"; // Handle empty case
  if (text.length <= maxLength)
    return showTooltip === true ? <Tooltip title={text}>{text}</Tooltip> : text; // No need to truncate

  const half = Math.floor((maxLength - 3) / 2); // "..." takes 3 characters G
  return showTooltip === true ? (
    <>
      {" "}
      {text.slice(0, half) + "..." + text.slice(-half)}
      <Tooltip title={text} className="ml-3">
        <CopyToClipboard text={text} onCopy={() => text && handleCopyButton()}>
          <Tooltip title="Copied" visible={copied} placement="right">
            <i className="fa fa-clone cursor-pointer hover:text-green-400 "></i>
          </Tooltip>
        </CopyToClipboard>
      </Tooltip>
    </>
  ) : (
    text.slice(0, half) + "..." + text.slice(-half)
  );
};
