const express = require("express")
const { run } = require("./test-gemini")
const cors = require("cors")
const port = process.env.PORT

const app = express()
app.use(express.json())
app.use(cors())

app.post('/chat',run)

app.listen(port,()=>{
    console.log(`listening on port ${port}`)
})

