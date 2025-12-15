import './App.css'

export default function App() {
    if (import.meta.env.SSR) {
        console.log("Home Server")
    } else {
        console.log("Home Client")
    }
    return (
        <>
            <header>
                <nav>
                    <menu className="flex gap-4 p-3 border rounded-sm">
                        <li className="hover:underline">
                            <a href="/">Home</a>
                        </li>
                        <li className="hover:underline">
                            <a href="/User">User</a>
                        </li>
                    </menu>
                </nav>
            </header>
            <main>
                <section className="p-3">
                    <h1 className="text-2xl font-semibold">Home</h1>
                    <button className="hover:bg-sky-700 bg-sky-800 rounded-sm p-1">Login</button>
                </section>
            </main>
        </>
    )
}