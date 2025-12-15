import {StrictMode} from 'react'
import {renderToString} from 'react-dom/server'
import App from './App'
import Head from "./Head.jsx";

/**
 * @param {string} _url
 */
export function render(_url) {
    const head = renderToString(
        <StrictMode>
            <Head/>
        </StrictMode>
    );

    const html = renderToString(
        <StrictMode>
            <App/>
        </StrictMode>,
    );
    return {html, head}
}