import React, {createContext, useState, useEffect} from 'react';
import axios from '../config/axios.js'

export const UserContext = createContext(null);

export const UserProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const restoreUser = async () => {
            try {
                const token = localStorage.getItem("token")

                if(!token){
                    setLoading(false)
                    return;
                }

                const response = await axios.get("/user/profile",{
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setUser(response.data.user);

            } catch (error) {
                localStorage.removeItem("token");
                setUser(null);

            } finally {
                setLoading(false);
            }
        };
        restoreUser();
    }, []);

    return (
        <UserContext.Provider value = {{user, setUser, loading}}>
            {children}
        </UserContext.Provider>
    )
}

