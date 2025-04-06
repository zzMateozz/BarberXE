import '../src/App.css'
import AdminPage from "./pages/Admin";
import Login from './pages/Login';
import { ToastContainer } from 'react-toastify';




function App() {
    return (
        <><ToastContainer
            position="top-right"
            autoClose={3000} /><AdminPage /></>
    );
}


export default App