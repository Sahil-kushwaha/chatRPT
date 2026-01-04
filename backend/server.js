import express from "express"
import generator from "./utils/llmCall.js"


const app = express()


app.use(express.json())
app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if(req.method==="OPTIONS") return res.sendStatus(200)
  next();

})

app.post('/chat', async (req,res)=>{
  try {
      const {message ,threadId,selectedTools} = req.body
      if(!message.trim() || !threadId) {
           res
           .status(400)
           .json({status:400,message:"All fields required"})
      }
  
      const llmResponse = await generator(message,threadId ,selectedTools)
      res
      .status(200)
      .json({status:200,data:llmResponse,message:"LLM generate response successfully"})
  } catch (error) {
    console.log(error)
      res
      .status(400)
      .json({message:error.message})
  }

})

app.get("/health",(req,res)=>{
     res
     .status(200)
     .json({status:200,message:"Server up and running"})
})

app.listen(3000,()=>{
     console.log(`Server is running on 3000`)
})