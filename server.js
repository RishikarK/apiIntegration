const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const accountSid = "ACb01978a95d75fc7e1c901db06cdc9912";
const authToken = "40ebcddc713d19c9bcc62fb9e945457c";
const Message = require("./Mongo/messageSchema");
const client = require("twilio")(accountSid, authToken);
const moment = require('moment-timezone');


const app = express();

// Mongoose Connection
mongoose.connect("mongodb://127.0.0.1:27017/conversation", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB!");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/sendMessage", async (req, res) => {
    try {

  
      const createdResponse = await client.messages.create({
        body: req.body.msg,
        from: `whatsapp:+${req.body.from}`,
        to: `whatsapp:+${req.body.to}`
      }) 
      
      console.log("cr------>",createdResponse)
      return await Message.create([
        {
          body: createdResponse.body,
          from: createdResponse.from.replace('whatsapp:+', ''),
          to: createdResponse.to.replace('whatsapp:+', ''),
          date: createdResponse.dateCreated,
          key: "send",
          type: "whatsapp",
        },
      ])
        .then((resp) => {
          res.status(200).send({ message: "Message sent", resp: resp });
        })
        .catch((error) => {
          console.log("send message error-->", error);
          res.send({ message: "Message fail", resp: error });
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Failed to send message" });
    }
});


app.get("/receiveMessages", async (req, res) => {

    const fromNumber=req.body.fromNumber;
    
  try {
    const messages = await client.messages.list({
      from: `whatsapp:+${fromNumber}`,  
      to: "whatsapp:+14155238886",
      dateSent: new Date("2024-01-16"),
    });

    // console.log("No Duplicate",messages)

    const allMessages = messages.map((message) => ({
      from: message.from.replace('whatsapp:+',""),
      to: message.to.replace('whatsapp:+',""),
      body: message.body,
      date: message.dateSent,
      key: "receive",
      type:"whatsapp"
    }));

        // console.log(allMessages)
    await Message.create(allMessages).then((receivedData) => {
      console.log("Data inserted");
      res.status(200).send({ msg: "Data received", data: receivedData });
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.send({ msg: "Error fetching messages" });
  }
});

app.get("/messages", async (req, res) => {
  return await Message.find({})
  .sort({_id:-1})
    .then((allData) => {
      res.status(200).send({ msf: "Conversation are :", convoData: allData });
    })
    .catch((error) => {
      return res.send({ msg: "No Messages Found" });
    });
});

app.get('/send', async (req, res) => {
    await Message.find({})
        .sort({ _id: 1 })
        .then((allData) => {
            const responseData = [];
            const mobileNumber = [];
            var leadNo;
            let num = 1;
            allData.map((mobile) => {
                if (!mobileNumber.includes(mobile.from) && mobile.from !== '14155238886') {
                    mobileNumber.push(mobile.from);
                }
            });
            if (mobileNumber.length) {
                mobileNumber.map((mobile) => {
                    const searchObject = allData.filter((messages) => {
                        return messages.from == mobile || messages.to == mobile;
                    });
                    const finalMsg = [];
                    const uniqueTimestamps = [];

                    searchObject.map((mobile) => {
                        if (!uniqueTimestamps.includes(mobile.date)) {
                            finalMsg.push({
                                body: mobile.body,
                                sent_date: mobile.date,
                                key: mobile.key,
                            });
                            uniqueTimestamps.push(mobile.date);
                        }
                    });

                    leadNo = num++;
                    console.log(leadNo);
                    responseData.push({
                        type: "whatsapp",
                        subject: mobile,
                        lead_no: "EP-00" + leadNo,
                        messages: finalMsg,
                    });
                });
            }
            res.send({ result: responseData });
        });
});

   

    // [
    //     {
    //       type: "whatsapp",
    //       "subject": "9866922070",
    //       "messages": [
    //         {
    //           "body": "Message 1",
    //           "sent_date": "2024 jan 1"
    //         },
    //         {
    //           "body": "Message 2",
    //           "sent_date": "2024 jan 1"
    //         }
    //       ]
    //     },
    //     {
    //       "type": "whatsapp",
    //       "subject": "9866922071",
    //       "messages": [
    //         {
    //           "body": "Message 4",
    //           "sent_date": "2024 jan 1"
    //         },
    //         {
    //           "body": "Message 5",
    //           "sent_date": "2024 jan 1"
    //         }
    //       ]
    //     },
    //     {
    //       "type": "whatsapp",
    //       "subject": "9866922073",
    //       "messages": [
    //         {
    //           "body": "Message 6",
    //           "sent_date": "2024 jan 1"
    //         },
    //         {
    //           "body": "Message 7",
    //           "sent_date": "2024 jan 1"
    //         }
    //       ]
    //     }
    // ] 



const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
