import { useContext, useEffect, useRef, useState } from "react";
import { RiSendPlaneFill, RiFolderUserFill } from "react-icons/ri";
import { HiOutlineDotsVertical } from "react-icons/hi";
import moment from "moment";

import { UsersContext } from "../contexts/users-context";
import { ChannelsContext } from "../contexts/channels-context";
import { MessagesContext } from "../contexts/messages-context";
import socket from "../services/socket";
import type { MessageInputDataInterface, MessageInterface } from "../interfaces/messages-interface";

import styles from "../styles/components/chat.module.scss";

const Chat: React.FC = () => {
  const { token: [token], user: [user] } = useContext(UsersContext);
  const { currentChannel: [currentChannel] } = useContext(ChannelsContext);
  const { messages: [messages, setMessages] } = useContext(MessagesContext);

  const [messageText, setMessageText] = useState("");
  const messagesContainerRef = useRef({} as HTMLDivElement);

  useEffect(() => {
    messagesContainerRef.current.scrollTo(0, messagesContainerRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    socket.on("send_message", (data: MessageInterface) => {
      setMessages((prevState: MessageInterface[]) => [...prevState, data]);
    });
  }, [setMessages]);

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    try {
      const inputData: MessageInputDataInterface = {
        channel: currentChannel._id,
        sender: user.username,
        text: messageText
      };

      const { default: messagesService } = await import("../services/messages-service");
      const { data } = await messagesService.postMessage(token, inputData);
      setMessages((prevState: MessageInterface[]) => [...prevState, { ...inputData, _id: data._id, createdAt: data.createdAt }]);
      setMessageText("");

      socket.emit("send_message", { ...inputData, _id: data._id });
    } catch (error: any) {
      return alert(error);
    }
  }

  return (
    <div className={styles.chat}>
      <div className={styles.top_section}>
        <div className={styles.column}>
          <div className={styles.hashtag} />
          <h3>{currentChannel.name}</h3>
        </div>

        <div className={styles.column}>
          <div className={styles.button}><RiFolderUserFill /></div>
          <div className={styles.button}><HiOutlineDotsVertical /></div>
        </div>
      </div>

      <div className={styles.messages} ref={messagesContainerRef}>
        <div className={styles.toast}>Each message is automatically deleted after 24 hours.</div>

        {messages.map((message, index) => (
          <div key={message._id} className={message.sender === user.username ? styles.right : styles.left}>
            <div className={`${styles.wrapper} ${index < messages.length - 1 && message.sender === messages[index + 1].sender ? styles.same_sender : ""}`}>
              <div className={styles.message}>{message.text}</div>
              <div className={styles.sender}>
                <div className={`${styles.avatar} ${message.sender !== user.username ? styles.visible : ""}`}>
                  {message.sender[0]}
                </div>

                <div className={styles.informations}>
                  <div className={styles.username}>{message.sender === user.username ? "You" : message.sender}</div>
                  <div className={styles.date}>{moment(message.createdAt).format("hh:mm A")}</div>
                </div>
              </div>
            </div> 
          </div>
        ))}
      </div>

      <div className={styles.bottom_section}>
        <form onSubmit={handleSendMessage} onKeyDown={event => event.key === "Enter" && handleSendMessage(event)} noValidate>
          <input
            type="text"
            id="message"
            autoComplete="off"
            placeholder="Write a message"
            value={messageText}
            onChange={event => setMessageText(event.target.value)}
          />

          <button type="submit" disabled={!messageText}>
            <RiSendPlaneFill />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;