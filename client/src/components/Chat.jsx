// Chat.js
import React, { useEffect, useState, useContext, useRef } from 'react';
import { uniqBy } from "lodash";
import axios from 'axios';
import Sidebar from './Chat/Sidebar';
import ChatArea from './Chat/ChatArea';
import MessageInput from './Chat/MessageInput';
import { UserContext } from './UserContext';
import { io } from "socket.io-client";

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const { username, id, setId, setUsername } = useContext(UserContext);

  useEffect(() => {
    //withCredentials: true  -- enable transfer credentials (cookies) during cors
    const newSocket = io("http://localhost:4040", {
      withCredentials: true,
      reconnection: true, //default
      // reconnectionAttempts: 5,
      // timeout: 10000, // Socket timeout
    });
    setSocket(newSocket);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        console.log(`myself ${socket.id}`);
      });

      socket.on('message', (msg) => {
        console.log("in socket got a message")
        handleMessage(JSON.parse(msg));
      });

      socket.on('onlineUsers', (onlineUsers) => {
        console.log(onlineUsers);
        showOnlinePeople(onlineUsers);
      });

      socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
      });
    }
  }, [socket]);

  // The rest of your code remains the same...
  const handleMessage = (messageData) => {

    if (typeof messageData.text === 'string' || messageData.text instanceof String) {
      console.log("got the string  message ", messageData)
      setNewMessageText('');
      setMessages(prev => ([...prev, {
        text: messageData.text,
        sender: selectedUserId,
        recipient: id,
        file:messageData.file,
        _id: Date.now(),
        // messageData
      }]));
    }
    else {
      console.log(messageData)
    }
  }

  const handleKeyPress = (ev) => {
    if (ev.key === 'Enter' && ev.shiftKey) {
      ev.preventDefault();

      // Get the cursor position
      const cursorPos = ev.target.selectionStart;

      // Insert a newline character at the cursor position
      setNewMessageText((prev) => {
        const textBeforeCursor = prev.substring(0, cursorPos);
        const textAfterCursor = prev.substring(cursorPos);
        return `${textBeforeCursor}\n${textAfterCursor}`;
      });
    } else if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      sendMessage(ev);
    }
  };

  const showOnlinePeople = (peopleArray) => {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  function logout() {
    axios.post('/logout').then(() => {
      setSocket(null);
      setId(null);
      setUsername(null);
    });
  }

  const sendMessage = (ev, file = null) => {
    if (ev) ev.preventDefault();
    //to not send empty messages
    if (newMessageText.trim() === '' && !file) return;

    console.log("inside sendMessage", file)

    socket.emit("message", JSON.stringify({
      recipient: selectedUserId,
      text: newMessageText,
      file,
    }));

    if (file) {
      axios.get('/messages/' + selectedUserId).then(res => {
        console.log("res data = ", res.data)
        setMessages(res.data);
      });
    }
    else {
      console.log("file ", file)
      console.log(newMessageText)
      
      
      setMessages(prev => ([...prev, {
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        //this _id is temp for client in, the backend it will be over written
        _id: Date.now(),
      }]));
      // const messagesWithoutDupes = uniqBy(messages, '_id');
      // setMessages(messagesWithoutDupes)
    }
    setNewMessageText('');
  }

  function sendFile(ev) {

    const file = ev.target.files[0];
    console.log("just entered sendFile")
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const fileData = {
        name: file.name,
        data: reader.result,
      };
      console.log("Inside sendFile:", fileData);

      // Call sendMessage with the fileData
      sendMessage(null, fileData);
    };

  }

  useEffect(() => {
    axios.get('/people').then(res => {
      const offlinePeopleArr = res.data
        .filter(p => p._id !== id)
        .filter(p => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach(p => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get('/messages/' + selectedUserId).then(res => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[id];


  return (
    <div className="flex h-screen">
      <Sidebar
        onlinePeople={onlinePeople}
        offlinePeople={offlinePeople}
        setSelectedUserId={setSelectedUserId}
        selectedUserId={selectedUserId}
      />
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <ChatArea id={id} messages={messages} selectedUserId={selectedUserId} />
        {!!selectedUserId &&
          (<MessageInput
            newMessageText={newMessageText}
            setNewMessageText={setNewMessageText}
            handleKeyPress={handleKeyPress}
            sendMessage={sendMessage}
            sendFile={sendFile}
          />)}
      </div>
    </div>
  );
}

export default Chat;
