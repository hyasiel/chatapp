show databases;
create database chat;
use chat;

CREATE TABLE users (
	id int auto_increment not null,
    uid varchar(255) not null,
    name varchar(255) not null,
    pass varchar(255) not null,
    UNIQUE (uid),
	PRIMARY KEY (id)
    
);

CREATE TABLE messages (
	message_id varchar(255) PRIMARY KEY,
    chat_id varchar(255) NOT NULL,
    emisor_id varchar(255) NOT NULL,
    destinatary_id varchar(255) NOT NULL,
    content varchar(10000) NOT NULL,
    timestamp DATETIME DEFAULT current_timestamp,
    FOREIGN KEY (chat_id) REFERENCES chats(chat_Id)
);

CREATE TABLE chats (
  chat_id VARCHAR(255) PRIMARY KEY,
  user1_id VARCHAR(255) NOT NULL,
  user2_id VARCHAR(255) NOT NULL,
  UNIQUE (user1_id, user2_id)
);

drop table chats;


delete from chats WHERE chat_id = "juan-ana";


SELECT * FROM chats WHERE user1_id = "estebanuid" OR user2_id = "estebanuid";

SELECT * FROM chats;

INSERT INTO users (uid, name, pass) VALUES ("estebanuid","esteban", "esteban1234");
INSERT INTO users (uid, name, pass) VALUES ("pepeuid","pepe", "pepe1234");
INSERT INTO users (uid, name, pass) VALUES ("anauid", "Ana", "ana123");



INSERT INTO users (uid, name, pass) VALUES ("carlosuid", "Carlos", "carlos1234");
INSERT INTO users (uid, name, pass) VALUES ("esteluid", "Estel", "estel1234");
INSERT INTO users (uid, name, pass) VALUES ("mariauid", "Maria", "maria1234");




INSERT INTO chats (chat_id, user1_id, user2_id) VALUES ("juan-ana", "juanuid", "anauid");
