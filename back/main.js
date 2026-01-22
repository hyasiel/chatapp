const express = require("express");
const path = require("path");
const {createServer} = require("node:http");
const {Server} = require("socket.io");
const { disconnect } = require("node:process");
const {getOrCreateChat, saveMessage, getMessages} = require("./DB/connections.js");
const {normalizePair} = require(path.join(__dirname, "/utils.js"))

const app = express();
const server = createServer(app)
const io = new Server(server, {connectionStateRecovery:{}});
const port = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", express.static(path.join(__dirname, "../front")));
app.use("/", express.static(path.join(__dirname, "../front/home")));
app.use("/", express.static(path.join(__dirname, "../front/inbox")));

app.use("/", require(path.join(__dirname, "/Points.js")));  

io.on("connection",(socket)=>{


  console.log("a user connected: ", socket.handshake.auth.uid)

  socket.join(socket.handshake.auth.uid);

  socket.on('joinChat', ({ user1, user2 }) => {
    const room = normalizePair(user1, user2);
    console.log(`sala entre ${user1} y ${user2}`)
    socket.join(room);
  });

  socket.on('sendMessage', async ({ from, to, content }) => {
    try {
      // Guarda en BD y recupera la fila completa
      const msg = await saveMessage(from, to, content);
      // Emite a todos en la sala (incluido el emisor)
      const { chatId } = normalizePair(from, to);
      io.to(chatId).emit('newMessage', msg);
      io.to(to).emit('newMessage', msg);

      const previewForReceiver = {
        contact_uid: from,
        last_message: msg.content,
        last_sender: msg.emisor_name,
        last_timestamp: msg.timestamp
      };

      const previewForSender = {
        contact_uid: to,
        last_message: msg.content,
        last_sender: "Yo",
        last_timestamp: msg.timestamp
      };

      io.to(to).emit("updateContactPreview", previewForReceiver);
      io.to(from).emit("updateContactPreview", previewForSender);
      
    } catch (e) {
      console.error('Error guardando mensaje:', e);
      socket.emit('errorMessage', { error: 'No se pudo guardar el mensaje' });
    }
  });

  socket.on("disconnect",()=>{
    console.log("a user disconnected")
  })

  socket.on("msg",(msg)=>{
    io.emit("msg", msg)
  })

})


app.get('/api/getMessages', async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    const { chatId } = normalizePair(user1, user2);
    const msgs = await getMessages(chatId);
    res.json(msgs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});






server.listen(port,"0.0.0.0", () => {
  console.log(`the server init in ${port} port`);
});
