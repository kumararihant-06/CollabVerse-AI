import React from 'react'
import AppRoutes from './Routes/AppRoutes'
import { UserProvider} from './context/User.context.jsx'
import { User } from 'lucide-react'
import { FileSystemContextProvider } from './context/FileSystem.context.jsx'
const App = () => {
  return (
    
      <UserProvider>
        <FileSystemContextProvider>
              <div><AppRoutes/></div>
        </FileSystemContextProvider>
      </UserProvider>
    
    
  )
}

export default App