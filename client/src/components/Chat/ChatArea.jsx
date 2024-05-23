// ChatArea.js
import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import { uniqBy } from "lodash";

const ChatArea = ({ id, messages, selectedUserId }) => {
  const divUnderMessages = useRef();

  function convertToIST(inputTime) {
    const dateObject = new Date(inputTime);
    const options = {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'Asia/Kolkata' // Indian Standard Time
    };

    const formattedTime = dateObject.toLocaleTimeString('en-US', options);
    return formattedTime;
  }

  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  //to get rid of duplicate messages
  const messagesWithoutDupes = uniqBy(messages, '_id');

  return (
    <div className="flex-grow">
      {!selectedUserId && (
        <div className="flex h-full flex-grow items-center justify-center">
          <div className="text-gray-300">&larr; Select a person from the sidebar</div>
        </div>
      )}
      {!!selectedUserId && (
        <div className="relative h-full">
          <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
            {messagesWithoutDupes.map(message => (

              <div key={message._id} className={(message.sender === id ? 'text-right break-words' : 'text-left break-words')}>
                <div className={"text-left inline-block p-2 my-2 rounded-md text-sm  max-w-[80%] break-words whitespace-break-spaces " + (message.sender === id ? 'bg-blue-500 text-white' : 'bg-green-400 text-gray-500')}>
                  {console.log("message text", typeof message.text)}
                  {message.text}
                  {message.file && (
                    <div className="">
                      <a target="_blank" className="flex items-center gap-1 border-b" href={axios.defaults.baseURL + '/uploads/' + message.file}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
                        </svg>
                        {console.log(message.file)}
                        {message.file}
                      </a>
                    </div>
                  )}
                  <div className={`text-xs text-gray-200 ${message.sender === id ? 'text-right' : ''}`}>
                    
                    {message.createdAt?convertToIST(message.createdAt):convertToIST(new Date())}

                  </div>
                </div>

              </div>
            ))}
            <div ref={divUnderMessages}></div>

          </div>
        </div>
      )}
    </div>

  );
}

export default ChatArea;
