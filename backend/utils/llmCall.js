import Groq from "groq-sdk"
import {tavily} from "@tavily/core"

const groq = new Groq({api_key:process.env.GROQ_API_KEY})
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

async function webSearch({query}){
      // api call or custom business logic 
      const tavily_response = await tvly.search(query)
      const resultList = tavily_response.results.map(result=>result.content)
      const finalResult = resultList.join("\n\n")
      return finalResult
}

async function generator(useInput){
         const message = [
              {
                   role:"system",
                   content: `you are smart assistance who answer the question.
                             you have access of following tools:
                             1. webSearch`
              }
          ]       
     
      message.push({role:"user",content:useInput})
     // loop of llm for calling tools if needed
   while(true){
     try {
       const response = await groq.chat.completions.create({
             model:"llama-3.3-70b-versatile",
             temperature:0,
             messages:message,
             tools:[
              {
                  "type":"function",
                  "function":{
                      "name":"webSearch",
                      "description":"Search the latest data or information on internet",
                      "parameters":{
                           "type":"object",
                           "properties":{
                                "query":{
                                   "type":"string",
                                   "description":"data to be search on internet/web"
                                },
                           },
                      "required":["query"]    
                      }    
                  }
              }
             ],
             tool_choice:"auto"   
  
        })
        // push assistance message 
       message.push(response.choices[0].message)

       const toolCalls=response.choices[0].message?.tool_calls
       if(!toolCalls){
           return response.choices[0].message.content
       }

      // we executing tools(generally function) manually  bcz llm do not execute function rather it respose with message what tool it want to call       
       for(const tool of toolCalls) {

          const functionName = tool?.function.name
          const arg = tool?.function.arguments

          if(functionName === "webSearch"){
            const toolResult = await webSearch(JSON.parse(arg))
            message.push({    
                    role:"tool",
                    tool_call_id:tool.id,
                    name:"webSearch",
                    content:toolResult

               })     
          }
      };

     }
     catch (error) { 
        throw error
      }
   }      
  } 

export  default generator