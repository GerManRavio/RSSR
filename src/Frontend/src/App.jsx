import './App.css'

export default function App() {
    if (import.meta.env.SSR) {
        console.log("Home Server")
    } else {
        console.log("Home Client")
    }
    return (
        <>
            <h1>Home</h1>
            <button>Login</button>
        </>
    )
}