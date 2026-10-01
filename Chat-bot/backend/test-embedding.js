const { GoogleGenAI } = require("@google/genai");

require("dotenv").config()

const ai = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY})

function cosineSimilarity(vecA,vecB){
    const n = vecA.length;
    let dotProduct = 0;
    let modA = 0;
    let modB = 0;
    for(let i = 0;i<n;i++){
        dotProduct += vecA[i]*vecB[i]
        modA += vecA[i]*vecA[i]
        modB += vecB[i]*vecB[i]
    }
    let val = dotProduct/(Math.sqrt(modA)*Math.sqrt(modB))
    return val;
}

async function getEmbedding(str){
    const res = await ai.models.embedContent({
        model:"gemini-embedding-001",
        contents:str
    })
    
    return res.embeddings[0].values
    
}



const products = [
    {"name":"laptop","description":"A 32gb ram , 512 gb ssd lenovo laptop"},
    {"name":"phone","description":"8bg ram , 256 gb storage , samsumg phone"},
    {"name":"banana","description":"yellow coloured sweeet fruit"}
]

async function precompute() {
    for(let p of products){
        p.embedding = await getEmbedding(p.description)
    }
}

async function search(query) {
    const queryEmbedding = await getEmbedding(query)
    for(let p of products){
        p.match = cosineSimilarity(queryEmbedding,p.embedding)
    }
    products.sort((a,b)=>b.match-a.match)
    for(let i = 0;i<3;i++){
        console.log(products[i].name+ " "+products[i].match)
    }
}

async function main() {
    await precompute()
    search("remote , a electronic device to control tv")
}

main()