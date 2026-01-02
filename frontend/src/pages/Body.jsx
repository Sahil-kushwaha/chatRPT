import { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
function Body() {
  
  const [ conversations,setConversations] = useState([])
  const [userQuery, setUserQuery]  = useState("")
  const [isProcess ,setIsProcess] = useState(true)
  const scrollRef = useRef(null)

  const generate = async(text)=>{
    // show userInput on UI
   try {
     const userInput = {role:"user" ,content:text}
     setUserQuery("")
     setConversations(prev=>[...prev,userInput])
     setIsProcess(true)
        // LLM call
      const abtCtrl = new AbortController()
      const reqTimeout= setTimeout(()=>{
          abtCtrl.abort()
          alert("time out retry")
          setIsProcess(false)
       },5000)
       const response = await fetch("http://localhost:3000/chat",
       {
         method:"POST",
         headers:{
          "Content-Type":"application/json"
         },
         signal:abtCtrl.signal,
         body:JSON.stringify({message:text})
       }
       )
       clearTimeout(reqTimeout)
       const jsonRes = await response.json()
       console.log(jsonRes)
       const llmRes = {role:"assistance" ,content:jsonRes.data}
       console.log(llmRes)
       // show result on UI
       setConversations(prev => [...prev ,llmRes])
       setIsProcess(false)
   } catch (error) {
      setIsProcess(false)
      console.error(error.message)
   }
       
  }



  const handleEnter = (e)=>{
     if(!userQuery.trim()) return
     if(e.key==="Enter") generate(userQuery.trim())
      
  }
  const handleSendBtn = ()=>{
     if(!userQuery.trim()) return
     generate(userQuery.trim())
  }
  
  useEffect(()=>{
    scrollRef.current.scrollIntoView()
  },[conversations])

  return (
    <div className="dark:bg-background-dark dark:text-text-dark bg-background-light  text-text-light min-h-screen">
      <div className="flex flex-col">
          <Header className="p-2" />
          <main className="max-w-3xl flex-1 self-center w-full pb-32 mt-6 ">
            {conversations.map((item,index)=>{
               if(item.role==="user"){
                  return <div key={index} className="bg-neutral-300 dark:bg-neutral-700 rounded-l-xl rounded-r-xl p-2 m-4 max-w-fit ml-auto">
                      {item.content}
                   </div>
               }
                  return <div key={index} className="bg-neutral-300 dark:bg-neutral-800 text-text-light dark:text-neutral-300  rounded-l-xl rounded-r-xl p-2 m-4 max-w-fit" >
                        {item.content}
                  </div>
            })}
            {isProcess?<div className="w-2 h-2 rounded-full bg-neutral-800 dark:bg-neutral-100 animate-ping m-4"></div>:"" }
            <div ref={scrollRef}></div>

            <div className="fixed inset-x-0 bottom-0 flex justify-center dark:bg-background-dark bg-background-light ">
              <div className="bg-neutral-300 dark:bg-neutral-700  rounded-2xl flex flex-col mb-6 lg:mx-12 w-full max-w-3xl">
                  <textarea
                   name="" 
                   id=""  
                   className=" flex-1 outline-none resize-none p-3  field-sizing-content"
                   value={userQuery}
                   onChange={(e)=>{setUserQuery(e.target.value)}} 
                   onKeyUp={e=>handleEnter(e)} 
                   ></textarea>
                  <div className="flex justify-between">
                    <button className="ml-2 cursor-pointer text-3xl font-light">+</button>
                    <button 
                    className="mr-2 mb-2 bg-neutral-800 dark:bg-neutral-100 text-neutral-100 hover:opacity-80 cursor-pointer dark:text-neutral-900 self-end px-4 py-1 text-2xl   rounded-full"
                    onClick={handleSendBtn}
                    >&#8593;</button>
                  </div>
              </div>
            </div>
          </main>
      </div>
    </div>
  );
}

export default Body;
