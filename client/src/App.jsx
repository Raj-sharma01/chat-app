import axios from "axios";
import { UserContextProvider } from "./components/UserContext";
import Routes from "./Routes";

function App() {
  console.log(import.meta.env.VITE_BACKEND_URL)
  axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
  axios.defaults.withCredentials = true;
  return (
    <>
      <UserContextProvider>
        <Routes/>
      </UserContextProvider>
    </>
  )
}

export default App
