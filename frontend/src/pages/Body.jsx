import { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import {Check, CircleMinus, CirclePlus, Copy, Globe, SendHorizontal, X} from "lucide-react"

function Body() {
  
  const [ conversations,setConversations] = useState([])
  const [userQuery, setUserQuery]  = useState("")
  const [isProcess ,setIsProcess] = useState(false)
  const [isAssistanceContentCopyToClipboard ,setIsAssistanceContentCopyToClipboard] = useState({})
  const [isUserContentCopyToClipboard ,setIsUserContentCopyToClipboard] = useState({})
  const [isUserContentHover ,setIsUserContentHover] = useState({})
  const [selectedTools,setSelectedTool] = useState({})
  const [isToolDialogToggle,setIsToolDialogToggle] = useState(false)

  const scrollRef = useRef(null)
  const threadId = useRef(null)

 useEffect(()=>{
   threadId.current = Date.now().toString(36)+Math.random().toString(36).substring(2,9) 
 },[])
  
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
         body:JSON.stringify({threadId:threadId.current,message:text,selectedTools:selectedTools})
       }
       )
       clearTimeout(reqTimeout)
       const jsonRes = await response.json()
       const llmRes = {role:"assistance" ,content:jsonRes.data}
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

  const handleCopyTextToClipboard = async (content,index ,fn)=>{
      try {
           await navigator.clipboard.writeText(content)
           fn((prev)=>({...prev,[index]:true}))
           setTimeout(()=>{
              fn(false)
           },2000)
      } catch (error) {
        console.error("failed to copy text",error)
      }
  }

  const handleMouseHover =(index)=>{
      setIsUserContentHover(prev=>({...prev,[index]:true}))
    }
  const handleMouseLeave =(index)=>{
      setTimeout(()=>{
        setIsUserContentHover(prev=>({...prev,[index]:false}))        
      },3000)
  }

  const handleToolSelection =(e)=>{
       const tool = e.target.dataset?.toolName
       if(!tool) return
       setSelectedTool(prev=>({...prev ,[tool]:true}))
       setIsToolDialogToggle(prev=>!prev)
  }
  return (
    <div className="dark:bg-background-dark dark:text-text-dark bg-background-light  text-text-light min-h-screen">
      <div className="flex flex-col">
          <Header className="p-2" />
          <main className="max-w-3xl flex-1 self-center w-full pb-32 mt-6 ">
            {conversations.map((item,index)=>{
               if(item.role==="user"){
                  return(
                    <div key={index} 
                      className="bg-neutral-300 dark:bg-neutral-700 rounded-l-xl rounded-r-xl p-2 m-4 max-w-fit ml-auto relative"
                      onMouseEnter={()=>handleMouseHover(index)}
                      onMouseLeave={()=>handleMouseLeave(index)}
                    >
                      {item.content}

                     {
                       isUserContentHover[index]?
                       <div
                        className="cursor-pointer  max-w-fit absolute right-0 -bottom-6 "
                        title="copy" 
                        onClick={()=>handleCopyTextToClipboard(item.content,index ,setIsUserContentCopyToClipboard)}
                       >
                         {isUserContentCopyToClipboard[index]?<Check size={16} strokeWidth={1.75} />:<Copy size={16} strokeWidth={1.75} />}
                       </div>:""
                     }   
                    </div>
                  )
               }
                  return( 
                    <div key={index} className="bg-neutral-300 dark:bg-neutral-800 text-text-light dark:text-neutral-300  rounded-l-xl rounded-r-xl p-2 m-4 max-w-fit" >
                        {item.content}
                        <div
                        className="cursor-pointer pt-2 " 
                        onClick={()=>handleCopyTextToClipboard(item.content,index,setIsAssistanceContentCopyToClipboard)}
                        >
                          {isAssistanceContentCopyToClipboard[index]?<Check size={16} strokeWidth={1.75} />:<Copy size={16} strokeWidth={1.75} />}
                        </div>
                    </div>)
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
                    <button 
                    className="ml-2 cursor-pointer hover:opacity-80 text-3xl font-light" 
                    onClick={()=>setIsToolDialogToggle(prev=>!prev)}
                    >{isToolDialogToggle?<CircleMinus />:<CirclePlus />}</button>
                    {/* dailog for all available tools */}
                   { isToolDialogToggle && <div aria-label="tool-selection-dialog" 
                        className="absolute z-10  -top-14 rounded-xl p-4 bg-neutral-300 dark:bg-neutral-900"
                        onClick={(e)=>handleToolSelection(e)}
                    >
                       <p className="flex gap-x-2 cursor-pointer hover:bg-neutral-800 p-2 rounded-xl" data-tool-name="WebSearch"><span><Globe /></span> <span data-tool-name="WebSearch">Web Search</span> </p>
                    </div>}
                    {/* show selected tool on UI */}
                    <div className=""> 
                      {Object.entries(selectedTools).map((tool,index)=>{
                      if(tool[1]){
                         return (<div key={index} className="flex gap-x-0.5 text-blue-400"><Globe color="#257dd0"/>{tool[0]}<span onClick={()=>setSelectedTool(prev=>({...prev ,[tool[0]]:!tool[0]}))} className="cursor-pointer"><X color="#d02525" strokeWidth={2.25} /></span></div>)
                      }
                    })}
                    </div>
                    <button 
                    className="mr-2 mb-2 bg-neutral-800 dark:bg-neutral-100 text-neutral-100 hover:opacity-80 cursor-pointer dark:text-neutral-900 self-end px-4 py-1 text-2xl   rounded-full"
                    onClick={handleSendBtn}
                    ><SendHorizontal /></button>
                  </div>
              </div>
            </div>
          </main>
      </div>
    </div>
  );
}

export default Body;
