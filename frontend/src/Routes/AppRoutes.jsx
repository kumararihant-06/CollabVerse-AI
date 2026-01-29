import React  from 'react'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import LoginPage from '../Pages/LoginPage'
import RegisterPage from '../Pages/RegisterPage'
import HomePage from '../Pages/HomePage'
import DashboardPage from '../Pages/DashboardPage'
const AppRoutes = () => {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/' element= {<HomePage/>}/>
            <Route path='/login' element= {<LoginPage/>}/>
            <Route path='/register' element= {<RegisterPage/>}/>
            <Route path='/dashboard' element= {<DashboardPage/>}/>
        </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes