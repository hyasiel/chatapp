const express = require('express')
const path = require("path")
const router = express.Router();
const db = require("./DB/connections.js");



router.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, '/../front/home/index.html'));
})



router.post('/inbox', (req, res) => {
  const { username, password } = req.body;

  db.verifyUsername(username, password)
    .then(user => {
        console.log(user.name)
        console.log("Respuesta enviada:", { success: true, uid: user.uid, name: user.name });
        
      if (user) {

        res.json({ success: true, uid: user.uid, name: user.name });
      } else {
        res.json({ success: false });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ success: false, error: "Error interno" });
    });
});



router.get("/login",(req, res)=>{
    res.sendFile(path.join(__dirname, '/../front/login/login.html'));
})


router.get("/signup",(req, res)=>{
  res.sendFile(path.join(__dirname, "/../front/signup/signup.html"));
})

router.post("/createNewUser",(req, res)=>{
  const {username, password} = req.body;
  const userid = username + "uid";
  db.createUser(userid, username, password)
  .then(user=>{
    if(user){
      console.log("usuario creado")
      res.json({ success: true});
    } else {
      res.json({ success: false});
      console.log("error al crear usuario");
    }
  })
})



router.get('/api/getContacts', async (req, res) => {
  const uid = req.query.uid;
  if (!uid) {
    return res.status(400).json({ error: "Falta el uid" });
  }

  try {
    const contacts = await db.getContactsWithLastMessages(uid);
    res.json(contacts);
  } catch (err) {
    console.error("Error obteniendo contactos con mensajes:", err);
    res.status(500).json({ error: "Error interno" });
  }
});




router.get("/api/addContact", async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ ok: false, error: "Faltan parámetros" });
  }

  try {
    const chatId = await db.getOrCreateChat(from, to);
    res.json({ ok: true, chatId });
  } catch (err) {
    console.error("❌ Error al crear chat:", err);
    res.status(500).json({ ok: false, error: "Error interno" });
  }
});





module.exports = router;