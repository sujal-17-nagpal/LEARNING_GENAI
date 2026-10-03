require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

class mcpServer {
  constructor() {
    this.tools = [];
  }
  addTool(name, description, runFunction) {
    const newTool = {
      schema: {
        name: name,
        description: description,
        parameters: {
          type: "OBJECT",
          properties: {
            price: { type: "NUMBER", description: "The price of the item" },
          },
          required: ["price"],
        },
      },
      run: runFunction,
    };
    this.tools.push(newTool);
  }

  call(toolName, args) {
    let n = this.tools.length;
    for (let i = 0; i < n; i++) {
      if (this.tools[i].schema.name == toolName) {
        return this.tools[i].run(args);
      }
    }
    return "no function with this toolName found";
  }

  list() {
    const schemas = [];
    for (let i = 0; i < this.tools.length; i++) {
      schemas.push(this.tools[i].schema);
    }
    return schemas;
  }
}

class mcpClient {
  constructor(server) {
    this.server = server;
  }
  async ask(query) {
    const chat = ai.chats.create({
      model: "gemini-3.5-flash-lite",
      config: {
        tools: [{ functionDeclarations: this.server.list() }],
      },
    });
    let response = await chat.sendMessage({ message: query });

    if (response.functionCalls) {
      const fcall = response.functionCalls[0];

      let resp = this.server.call(fcall.name, fcall.args);

      response = await chat.sendMessage({
        message: [
          {
            functionResponse: {
              name: fcall.name,
              response: resp,
            },
          },
        ],
      });
    }
    return response.text;
  }
}

async function main() {
  const server = new mcpServer();
  // --- TOOL 1: 20% Discount ---
  server.addTool(
    "calculateDiscount",
    "Calculates a 20% discount on an item price",
    (args) => {
      return { finalPrice: args.price * 0.8 };
    },
  );
  // --- TOOL 2: 10% Tax ---
  server.addTool(
    "calculateTax",
    "Calculates 10% sales tax on an item price",
    (args) => {
      return { taxAmount: args.price * 0.1 };
    },
  );
  // Connect client to server
  const client = new mcpClient(server);
  // Test 1: Should trigger Tool 1 (Discount)
  console.log("--- TEST 1: DISCOUNT ---");
  const answer1 = await client.ask(
    "What is the price of a $100 jacket after discount?",
  );
  console.log("AI Answer:\n" + answer1 + "\n");
  // Test 2: Should trigger Tool 2 (Tax)
  console.log("--- TEST 2: TAX ---");
  const answer2 = await client.ask("How much is the tax on a $200 phone?");
  console.log("AI Answer:\n" + answer2);
}
main();
