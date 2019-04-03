import { component } from "haunted";
import { html } from "lit-html";
import "boo-routely";

import "./cat-page";
import "./style.css";

function App() {
  return html`
    <p>${window.location.pathname}</p>
    <boo-routely>
      <template>
        <p>Page not found!</p>
        <p><boo-link to="/"></boo-link></p>
      </template>

      <template route="/">
        <h2>Kitty cat links</h2>
        <ul>
          <li><boo-link to="/cats/kokusho">Kokusho</boo-link></li>
          <li><boo-link to="/cats/rika">Rika</boo-link></li>
          <li>
            <boo-link to="/sadffssdfasdf"
              >Page that doesn't exist</boo-link
            >
        </li>
      </template>

      <template route="/cats/:name">
        <cat-page/>
      </template>
    </boo-routely>
  `;
}

customElements.define("router-app", component(App));
