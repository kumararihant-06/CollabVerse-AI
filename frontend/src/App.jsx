import React from 'react'
import AppRoutes from './Routes/AppRoutes'
import { UserProvider} from './context/User.context.jsx'
import { User } from 'lucide-react'
const App = () => {
  return (
    
      <UserProvider>
        <div><AppRoutes/></div>
      </UserProvider>
    
    
  )
}

export default App