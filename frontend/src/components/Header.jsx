import React from 'react'

function Header({className}) {
  return (
    <div className={`fixed inset-x-0  dark:bg-background-dark bg-background-light ${className}`}>
       {/* TODO:- implement drop down */}
       <select name="" id="" className='bg-neutral-800'>
         
         <option value="">ChatGPT</option>
         <option value="">gemini 2.5</option>
         <option value="">gptoss-70b</option>
       </select>
    </div>
  )
}

export default Header