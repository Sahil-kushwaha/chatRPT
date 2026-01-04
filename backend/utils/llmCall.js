import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";

const groq = new Groq({ api_key: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 });

async function webSearch({ query }) {
  // api call or custom business logic
  const tavily_response = await tvly.search(query);
  const resultList = tavily_response.results.map((result) => result.content);
  const finalResult = resultList.join("\n\n");
  return finalResult;
}

async function generator(useInput, threadId,selectedTools) {

  try {
    const baseMessage = [
      {
        role: "system",
        content: `you are smart assistance who answer the question.
        if you have answer to the question generate and return else use the provided tool to get unavailable information.
        you have access of following tools:
        1. webSearch //Search the latest data or information on internet `,
      },
    ];

    const message = cache.get(threadId) ?? baseMessage;

    message.push({ role: "user", content: useInput });

    // loop of llm for calling tools if needed
    // prevent from getting into infinite loop if llm try to call tool infinitly
    const MAX_ITERATION = 10;
    let count = 0;
    while (true) {
      if (count > MAX_ITERATION) {
        throw new Error({ message: "something went wrong please try again" });
      }
      count++;
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        messages: message,
        tools: [
          {
            type: "function",
            function: {
              name: "webSearch",
              description: "Search the latest data or information on internet",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "data to be search on internet/web",
                  },
                },
                required: ["query"],
              },
            },
          },
        ],
        tool_choice: selectedTools?.WebSearch?"required":"auto",
      });
      // push assistance message
      message.push(response.choices[0].message);

      const toolCalls = response.choices[0].message?.tool_calls;
      if (!toolCalls) {
        // saved message history
        //here we saved message history but after some time it get messive amount that leads to context window limit reach, cost ineffective due to large no. of input token
        // Sol: summerize message history(use llm call) or truncate it all method easily available on framework like langchain , langgraph so we don't do here manually it may hectic
        //TODO: sol
        cache.set(threadId, message);
        // console.log(cache.get(threadId));
        return response.choices[0].message.content;
      }

      // we executing tools(generally function) manually  bcz llm do not execute function rather it respose with message what tool it want to call
      for (const tool of toolCalls) {
        const functionName = tool?.function.name;
        const arg = tool?.function.arguments;
        if (functionName === "webSearch") {
          console.log("websearch...")
          const toolResult = await webSearch(JSON.parse(arg));
          message.push({
            role: "tool",
            tool_call_id: tool.id,
            name: "webSearch",
            content: toolResult,
          });
        }
      }
    }
  } catch (error) {
    throw error;
  }
}
export default generator;
