require("dotenv").config()

const {GoogleGenAI} = require("@google/genai")

const ai = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY})

async function getEmbedding(data) {
    const response = await ai.models.embedContent({
        model:"gemini-embedding-001",
        contents:data
    })
    // console.log(response.embeddings[0].values)
    return response.embeddings[0].values
}

function cosineSimilarity(vecA,vecB) {
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for(let i =0;i<vecA.length;i++){
        dot += vecA[i]*vecB[i];
        magA += vecA[i]*vecA[i];
        magB += vecB[i]*vecB[i];
    }
    return (dot/(Math.sqrt(magA)*Math.sqrt(magB)))
}

async function findBestChunk(query,chunkVector,chunks){
    let bestChunk = 0;
    let bestSimilarity = 0;
    let queryEmbedding = await getEmbedding(query)
    for(let i = 0;i<chunkVector.length;i++){
        let similarity = cosineSimilarity(queryEmbedding,chunkVector[i])
        if(similarity>bestSimilarity){
            bestSimilarity = similarity;
            bestChunk = i;
        }
    }
    if(bestSimilarity < 0.6) return null;
    return chunks[bestChunk]
}

const myDocument = `Returns are accepted within 30 days. Opened items have a 15% fee.
Laptops have a 1-year hardware warranty for motherboard and screen defects.
Warranty does NOT cover water damage or physical drops.
Batteries below 80% capacity in the first 6 months get a free replacement.`;

async function main(){
    const chunks = myDocument.split("\n")
    const chunkVector = []
    for(let i = 0;i<chunks.length;i++){
        const embedding = await getEmbedding(chunks[i])
        chunkVector.push(embedding)
        console.log(`saved embedding for chunk ${i+1}`)
    }

    const userQuestion = "My laptop fell into a pool. Can I get a free repair?";
    const relevantChunk = await findBestChunk(userQuestion,chunkVector,chunks)
    if(!relevantChunk){
        console.log("sorry , i cannot answer to this")
        return;
    }
    console.log(`relevant chunk : ${relevantChunk}`)

    const prompt = "Answer this question using this rule: " + relevantChunk + ". Question: " + userQuestion;

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents:prompt
    })
    console.log("\nAI Answer:\n" + response.text);
}

main()