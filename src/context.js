import { createContext } from "haunted";

export const RouterContext = createContext();

customElements.define("boo-routely-provider", RouterContext.Provider);
customElements.define("boo-routely-consumer", RouterContext.Consumer);
