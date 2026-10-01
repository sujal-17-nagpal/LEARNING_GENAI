require("dotenv").config();

const { GoogleGenAI, FunctionResponse } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function getOrderStatus(orderId){
  const orders = {
    "1041":{item : "laptop",status:"out for delivery",expected:"will get delivered by today"},
    "1042":{item:"phone",status:"delivered",expected:"was delivered yesterday"}
  }
  return orders[orderId] || "order not found"
}

const orderTool = {
  name:"getOrderStatusTool",
  description: "Look up the live delivery and shipping status of a customer order by its order ID.",
  parameters:{
    type:"Object",
    properties:{
      orderId:{type:"String",description:"This is order no"}
    }
  }
}

const run = async (req, res) => {
  try {
    const {message,history} = req.body;
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history:history || [],
      message:message,
      config: {
        temperature: 0.2,
        tools:[{functionDeclarations:[orderTool]}],
        systemInstruction:"You have to give sarcastic replies"
      },
    });
    let response = await chat.sendMessageStream({message})
    
    if(response.functionCalls){
      const call = response.functionCalls[0];
      if(call){
        const res = getOrderStatus(call.args.orderId)
        response = await chat.sendMessageStream({
          message:[
            {functionResponse:{
              name : call.name,
              response:res
            }}
          ],
      })
      
      }
      // console.log(call);
    }
    console.log("\n--- Model Response ---");
    for await(const c of response){
      if(c.text){
        res.write(c.text);
      }
      
    }
    
    res.end();
  } catch (error) {
    console.log(error.message);
    res.end();
    // return res.status(400).json({ message: error.message });
  }
};


module.exports = { run };
