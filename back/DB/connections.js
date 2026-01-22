const path = require("path")
require("dotenv").config({path: path.join(__dirname, "/../../config/.env")})
const { v4: uuidv4 } = require('uuid');


const {normalizePair} = require(path.join(__dirname, "/../utils.js"))


const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: process.env.PORT
});

connection.connect();



function query(sql, params=[]) {
  return new Promise((res, rej) => {
    connection.query(sql, params, (err, results) => {
      if (err) return rej(err);
      res(results);
    });
  });
}



// Verifica si el usuario existe y si la contraseña coincide
function verifyUsername(usr, pass) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM users WHERE name = ?`, [usr], (err, res) => {
      if (err) {
        reject(err);
      } else if (res.length === 0) {

        resolve(false);
        
        } else {
        verifyPassword(usr, pass)
          .then(isValid => {
            if(isValid){
              resolve(res[0]);
            }
            resolve(false);
            
          })
          .catch(reject);
      }
    });
  });
}

// Verifica si la contraseña coincide con la del usuario
function verifyPassword(u, p) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT pass FROM users WHERE name = ?`, [u], (err, res) => {
      if (err) {
        reject(err);
      } else if (res.length === 0) {
        resolve(false);
      } else {
        const passFromDB = res[0].pass;
        if (passFromDB === p) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
}

function getContactsForUser(uid) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT DISTINCT u.uid AS contact_uid, u.name AS contact_name
      FROM chats c
      JOIN users u ON (
        (c.user1_id = ? AND u.uid = c.user2_id)
        OR
        (c.user2_id = ? AND u.uid = c.user1_id)
      )
    `;

    connection.query(sql, [uid, uid], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

function getLastMessageBetween(user1, user2) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT m.content, m.timestamp, u.name AS sender_name, m.emisor_id
      FROM messages m
      JOIN users u ON u.uid = m.emisor_id
      WHERE (m.emisor_id = ? AND m.destinatary_id = ?)
         OR (m.emisor_id = ? AND m.destinatary_id = ?)
      ORDER BY m.timestamp DESC
      LIMIT 1
    `;
    connection.query(sql, [user1, user2, user2, user1], (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) return resolve(null);
      resolve(results[0]);
    });
  });
}


async function getContactsWithLastMessages(uid) {
  try {
    const contacts = await getContactsForUser(uid);
    const enrichedContacts = await Promise.all(
      contacts.map(async contact => {
        const lastMsg = await getLastMessageBetween(uid, contact.contact_uid);
        return {
          ...contact,
          last_message: lastMsg?.content || null,
          last_timestamp: lastMsg?.timestamp || null,
          last_sender: lastMsg
            ? (lastMsg.emisor_id === uid ? 'Yo' : lastMsg.sender_name)
            : null
        };
      })
    );
    return enrichedContacts;
  } catch (err) {
    throw err;
  }
}




async function getOrCreateChat(u1, u2) {
  const { user1, user2, chatId } = normalizePair(u1, u2);
  // Inserta solo si no existe
  await query(`
    INSERT IGNORE INTO chats (chat_id, user1_id, user2_id)
    VALUES (?, ?, ?)
  `, [chatId, user1, user2]);
  return chatId;
}

async function createUser(uid, username, password) {
  await query(`
    INSERT INTO users (uid, name, pass) VALUES (?, ?, ?)
  `, [uid, username, password]);
  return username;
}


// 2.2 Guardar mensaje
async function saveMessage(from, to, content) {
  const chatId = await getOrCreateChat(from, to);
  const messageId = uuidv4();
  await query(`
    INSERT INTO messages
      (message_id, chat_id, emisor_id, destinatary_id, content)
    VALUES (?, ?, ?, ?, ?)
  `, [messageId, chatId, from, to, content]);

  // Ahora devolvemos también el nombre
  const [msg] = await query(`
    SELECT 
      m.message_id,
      m.emisor_id,
      u1.name AS emisor_name,
      m.destinatary_id,
      u2.name AS destinatary_name,
      m.content,
      m.timestamp
  FROM messages m
  JOIN users u1 ON m.emisor_id = u1.uid
  JOIN users u2 ON m.destinatary_id = u2.uid
  WHERE m.message_id = ?

  `, [messageId]);
  return msg;
}


async function getMessages(chatId) {
  return query(`
    SELECT 
      m.emisor_id,
      u.name      AS emisor_name,
      m.destinatary_id,
      m.content,
      m.timestamp
    FROM messages m
    JOIN users u 
      ON m.emisor_id = u.uid
    WHERE m.chat_id = ?
    ORDER BY m.timestamp ASC
  `, [chatId]);
}




module.exports = {verifyUsername, getContactsForUser, getMessages, getOrCreateChat, saveMessage, createUser, getContactsWithLastMessages};