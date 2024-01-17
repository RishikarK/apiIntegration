const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const accountSid = "ACb01978a95d75fc7e1c901db06cdc9912";
const authToken = "79334b9ce694385711abe5df18fb2077";
const Message = require("./Mongo/messageSchema");
const client = require("twilio")(accountSid, authToken);
const cors=require('cors')



const app = express();
app.use((cors()))
app.use(bodyParser.json());

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
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });


//WhatsApp Response
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
      res.status(500).json({ msg: "Failed to send message",cause:error.message });
    }
});

app.get('/insta', async (req,res)=>{
//InstagramResponse
        const axios = require('axios');
    
        const options = {
          method: 'GET',
          url: 'https://instagram130.p.rapidapi.com/account-medias',
        // url:'https://instagram130.p.rapidapi.com/account-feed',
          params: {
            userid: '64173825693',
            first: '40'
            // username: 'enterpi12',
          },
          headers: {
            'X-RapidAPI-Key': '5b2a013f1fmsh3446fc897fb7f37p11a9efjsn49af4ee4674b',
            'X-RapidAPI-Host': 'instagram130.p.rapidapi.com',
            // 'Access-Control-Allow-Origin':"*",
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        };
        
        try {
            const response = await axios.request(options);
            console.log("Posts Name------------------------>")
            console.log(response.data.edges[2].node.__typename)
            console.log("#########################")

            
            const imageUrl = response.data.edges[1].node.display_url;
            // const comment =response.data.edges[2].node.edge_media_to_comment.edges[2].node.text;
                let com=[]
            response.data.edges[1].node.edge_media_to_comment.edges.map((comm)=>{
                com.push(comm.node.text)
            })
            console.log(com)
            return await Message.create([
                {
                    type:"instagram",
                    from:response.data.edges[1].node.__typename,
                    image:imageUrl,
                    body:com.toString(),
                    to:response.data.edges[1].node.id,
                }
                 
   
            ]).then((result)=>{
                res.header('Access-Control-Allow-Origin', 'https://scontent-lhr8-1.cdninstagram.com/v/t51.2885-15/417774436_397122042683687_2625426874023109854_n.jpg?stp=dst-jpg_e15&_nc_ht=scontent-lhr8-1.cdninstagram.com&_nc_cat=111&_nc_ohc=MdIjvTsAaPQAX_c7118&edm=APU89FABAAAA&ccb=7-5&oh=00_AfBdVmsIRGxPMXJJa4geDGVJUIgn4ajhnN7yMT1DqyfzSg&oe=65AB02BE&_nc_sid=bc0c2chttps://scontent-lhr8-1.cdninstagram.com/v/t51.2885-15/417774436_397122042683687_2625426874023109854_n.jpg?stp=dst-jpg_e15&_nc_ht=scontent-lhr8-1.cdninstagram.com&_nc_cat=111&_nc_ohc=MdIjvTsAaPQAX_c7118&edm=APU89FABAAAA&ccb=7-5&oh=00_AfBdVmsIRGxPMXJJa4geDGVJUIgn4ajhnN7yMT1DqyfzSg&oe=65AB02BE&_nc_sid=bc0c2c');
                // res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                // res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                res.status(200).send({msg:result})
            })
        } catch (error) {
            console.error(error);
        }

})


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
            var leadNo=1;
            // let num = 1;
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
                    console.log("searchObject--->",searchObject)
                    let respObj = {
                        
                        type:  searchObject[0].type,
                        image:'',
                        subject: mobile,
                        lead_no: "EP-00" + leadNo,
                        messages: [],
                    }
                    leadNo++;
                    const finalMsg = [];
                    const uniqueTimestamps = [];
                    const type=[]
                    searchObject.map((mobile) => {
                        console.log(mobile)
                        respObj.image=mobile.type=='instagram'?mobile.image:'';
                        if (!uniqueTimestamps.includes(mobile.date)) {
                            finalMsg.push({
                                
                                body: mobile.body,
                                sent_date: mobile.date,
                                key: mobile.key
                            });
                            uniqueTimestamps.push(mobile.date);
                        }
                    });
                    console.log(searchObject.image)
                    // leadNo = num++;
                    // responseData.push({
                    //     image:searchObject[0].image,
                    //     type:  searchObject[0].type,
                    //     subject: mobile,
                    //     lead_no: "EP-00" + leadNo,
                    //     messages: finalMsg,
                    // });
                    respObj.messages=finalMsg;
                    responseData.push(respObj)
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



    const PORT = 4000; // Use only the port number
    const IP_ADDRESS = '192.168.1.63'; // Replace with your server's IP address
    
    app.listen(PORT, IP_ADDRESS, () => {
      console.log(`Server is running on http://${IP_ADDRESS}:${PORT}`);
    });
    
