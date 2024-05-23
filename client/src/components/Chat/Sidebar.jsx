// Sidebar.js
import React, { useContext, useEffect, useState } from 'react';
import Logo from '../Logo';
import Contact from '../Contact';
import { UserContext } from '../UserContext';
import axios from 'axios';

const Sidebar = ({ onlinePeople, offlinePeople, setSelectedUserId, selectedUserId }) => {

  const { username, id, setId, setUsername } = useContext(UserContext);

  const createGroup = async () => {
    const groupName = prompt('Enter group name:');
    const members = prompt('Enter member usernames, separated by commas:').split(',').map(username => username.trim());

    // Make an API request to create the group
    try {
      const response = await axios.post('/groups/create', { groupName, members });
      console.log('Group created:', response.data);
    } catch (error) {
      console.error('Error creating group:');
    }
  };

  const getGroups=async()=>{
    try {
      const response = await axios.get('/groups/userGroups');
      return response.data
      console.log('Groups:', response.data);
    } catch (error) {
      console.error('Error creating group:');
    }
  }

  const [groups,setGroups]=useState([]);

  useEffect(()=>{
     const fetchGroups=async()=>{
      const groups=await getGroups();
       setGroups(groups)
     }
     fetchGroups()
  },[])

  return (
    <div className="bg-white w-1/3 flex flex-col">
      <div className="flex-grow">
        <div className='flex'>
          <Logo />
          <button className='bg-blue-300 rounded-md' onClick={createGroup}>Create Group</button>
        </div>
        {groups?.map(group=>(
          <Contact
            key={group._id}
            id={group._id}
            online={true}
            username={group.name}
            // setSelectedUserId(group._id)
            onClick={() => {  console.log(group._id)}}
            selected={group._id === selectedUserId}
          />
        ))

        }
        {Object.keys(onlinePeople).map(userId => (
          userId != id && <Contact
            key={userId}
            id={userId}
            online={true}
            username={onlinePeople[userId]}
            onClick={() => { setSelectedUserId(userId); console.log({ userId }) }}
            selected={userId === selectedUserId}
          />
        ))}
        {Object.keys(offlinePeople).map(userId => (
          <Contact
            key={userId}
            id={userId}
            online={false}
            username={offlinePeople[userId].username}
            onClick={() => setSelectedUserId(userId)}
            selected={userId === selectedUserId}
          />
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
