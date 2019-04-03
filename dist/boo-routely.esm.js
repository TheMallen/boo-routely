import { html } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { createContext, component, useMemo, useState, useEffect, useCallback } from 'haunted';
import Navigo from 'navigo';

const RouterContext = createContext();

customElements.define("boo-routely-provider", RouterContext.Provider);
customElements.define("boo-routely-consumer", RouterContext.Consumer);

function _Router(el) {
  const routes = useMemo(
    () =>
      Array.from(el.children)
        .filter(child => child.nodeName === "TEMPLATE")
        .map(child => ({
          route: child.getAttribute("route"),
          template: child.innerHTML
        })),
    [el.children]
  );

  const [matched, setMatched] = useState(false);
  const navigo = useMemo(() => new Navigo(window.location.origin), []);

  useEffect(() => {
    routes.forEach(({ route, template }) => {
      if (route) {
        navigo.on(route, (params, query) =>
          setMatched({ route, template, params, query })
        );
      } else {
        navigo.notFound(() => setMatched({ route, template }));
      }
    });
    navigo.resolve();
  }, [navigo, routes]);

  const router = useMemo(
    () => ({
      matched: {
        route: matched.route,
        params: matched.params,
        query: matched.query
      },
      link: navigo.link.bind(navigo),
      pause: navigo.pause.bind(navigo),
      resume: navigo.resume.bind(navigo),
      navigate: navigo.navigate.bind(navigo)
    }),
    [navigo, matched]
  );

  return html`
    <boo-routely-provider .value="${router}">
      ${unsafeHTML(matched.template)}
    </boo-routely-provider>
  `;
}
const Router = component(_Router);

function _Link({ to, cssClass }) {
  const router = useContext(RouterContext);
  const navigate = useCallback(
    event => {
      event.preventDefault();
      router.navigate(to);
    },
    [router, to]
  );

  return html`<a href="" @click="${navigate}" class="${cssClass}"><slot></slot></a>`;
}
_Link.observedAttributes = ["to", "css-class"];

const Link = component(_Link);

customElements.define("boo-link", Link);
customElements.define("boo-routely", Router);

export { RouterContext };
