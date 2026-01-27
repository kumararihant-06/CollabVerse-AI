import React from 'react'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import LoginPage from '../Pages/LoginPage'
import RegisterPage from '../Pages/RegisterPage'
import HomePage from '../Pages/HomePage'
const AppRoutes = () => {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/' element= {<HomePage/>}/>
            <Route path='/login' element= {<LoginPage/>}/>
            <Route path='/register' element= {<RegisterPage/>}/>
        </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes