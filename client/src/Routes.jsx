import React ,{useContext} from 'react'
import { UserContext } from './components/UserContext';
import RegisterAndLoginForm from './RegisterAndLoginForm';
import Chat from './components/Chat';


const Routes = () => {
    const {username, id} = useContext(UserContext);

    if (username) {
      return <Chat/>
    }
  return (
    <>
     <RegisterAndLoginForm/> 
    </>
  )
}

export default Routes
