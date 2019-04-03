import { component, useContext } from "haunted";
import { html } from "lit-html";
import { RouterContext } from 'boo-routely';

const useRouter = () => useContext(RouterContext);

function CatPage() {
  const {matched: {params}} = useRouter()

  return html`
    <div>Cute cat named ${params.name}</div>
    <boo-link to="/">Home</boo-link>
  `;
}

customElements.define("cat-page", component(CatPage));
