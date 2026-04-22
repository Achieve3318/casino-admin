import { MehOutlined } from "@ant-design/icons";
import { Input } from "antd";
import EmojiPicker from "emoji-picker-react";
import React, { useState } from "react";

const MessageInput = ({ disabled = false, onSend = (f) => f }) => {
  const [message, setMessage] = useState("");
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);

  // Handle emoji selection
  const handleAddEmoji = ({ emoji }) => {
    setMessage((prevMessage) => prevMessage + emoji);
    setEmojiPickerVisible(false);
  };

  // Handle send message
  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <>
      {emojiPickerVisible && (
        <div className="absolute bottom-10">
          <EmojiPicker onEmojiClick={handleAddEmoji} />
        </div>
      )}
      <Input
        className="rounded-lg p-3 mx-3 border-2 hover:border-[#1475E1] shadow-md"
        placeholder="Message..."
        value={message}
        disabled={disabled}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        suffix={
          <div
            onClick={(e) => {
              e.stopPropagation();
              setEmojiPickerVisible(true);
            }}
          >
            <MehOutlined className="cursor-pointer" />
          </div>
        }
      />
    </>
  );
};

export default MessageInput;
