import { useState } from "react";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hello! I am GearBot from GearShift Electronics. How can I assist you with your orders or returns today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    // 1. Add user message to UI state immediately
    const updatedMessages = [...messages, { role: "user", text: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // 2. Format previous messages into Gemini history format
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      // 3. Send to our Express backend
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history }),
      });

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let botReply = ""
      while(true){
        const {value,done} = await reader.read();
        if(done) break;

        const decoded = decoder.decode(value)
        botReply+=decoded
        setMessages([
          ...updatedMessages,
          {role:"model",text:botReply}
        ])
      }

     
    } catch (err) {
      console.error(err);
      setMessages([
        ...updatedMessages,
        {
          role: "model",
          text: "Sorry, I am having trouble connecting to the server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", fontFamily: "sans-serif" }}>
      <header style={{ padding: "16px", background: "#1f2937", color: "white", borderRadius: "8px 8px 0 0" }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>GearShift Support Chat</h2>
        <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Online • Policy Guardrails Active</span>
      </header>

      {/* Chat Messages Window */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderTop: "none",
          height: "450px",
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          background: "#f9fafb",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "75%",
              padding: "10px 14px",
              borderRadius: "12px",
              background: msg.role === "user" ? "#2563eb" : "#ffffff",
              color: msg.role === "user" ? "#ffffff" : "#1f2937",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              lineHeight: "1.4",
              fontSize: "0.95rem",
              border: msg.role === "model" ? "1px solid #e5e7eb" : "none",
            }}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", color: "#6b7280", fontStyle: "italic", fontSize: "0.85rem" }}>
            GearBot is typing...
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={sendMessage} style={{ display: "flex", marginTop: "8px", gap: "8px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about return policy, order status..."
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontSize: "1rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0 20px",
            background: loading ? "#9ca3af" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default App;