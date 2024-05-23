# Pros and Cons of Socket.IO

## Pros

- ### Broadcasting

- ### Multiplexing


- ### Auto Reconnection

Socket.IO provides automatic reconnection capabilities, allowing clients to reconnect to the server seamlessly.

- ### Heartbeat Mechanism (Ping/Pong)

Socket.IO uses a ping/pong mechanism for heartbeat checks to ensure the connection's health. 
### Below is a raw implementation of Ping/Pong mechanism:

```javascript
// Server-side
io.on('connection', async (socket) => {

  function notifyAboutOnlinePeople() {
    const onlineUsers = [...Array.from(io.sockets.sockets)].map(([id, s]) => ({ username: s.username, userId: s.userId }));
    io.emit('onlineUsers', onlineUsers);
  }

  socket.isAlive = true;

  socket.timer = setInterval(() => {
    socket.emit('ping');
    socket.deathTimer = setTimeout(() => {
      socket.isAlive = false;
      clearInterval(socket.timer);
      socket.disconnect(true);
      notifyAboutOnlinePeople();
      console.log('dead');
    }, 1000);
  }, 5000);

  socket.on('pong', () => {
    clearTimeout(socket.deathTimer);
  });

  socket.on('disconnect', () => {
    clearInterval(socket.timer);
    notifyAboutOnlinePeople();
    console.log('disconnected');
  });

  notifyAboutOnlinePeople();
});
```
```javascript
// Client-side ping/pong implementation:
socket.on('ping', () => {
  socket.emit('pong');
});
```


## Cons of Socket.IO

- In terms of memory usage, Socket.IO may perform poorly compared to a plain WebSocket server based on the ws package.










