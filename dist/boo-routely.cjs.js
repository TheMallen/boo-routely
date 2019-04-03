'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var litHtml = require('lit-html');
var unsafeHtml_js = require('lit-html/directives/unsafe-html.js');
var haunted = require('haunted');
var Navigo = _interopDefault(require('navigo'));

const RouterContext = haunted.createContext();

customElements.define("boo-routely-provider", RouterContext.Provider);
customElements.define("boo-routely-consumer", RouterContext.Consumer);

function _Router(el) {
  const routes = haunted.useMemo(
    () =>
      Array.from(el.children)
        .filter(child => child.nodeName === "TEMPLATE")
        .map(child => ({
          route: child.getAttribute("route"),
          template: child.innerHTML
        })),
    [el.children]
  );

  const [matched, setMatched] = haunted.useState(false);
  const navigo = haunted.useMemo(() => new Navigo(window.location.origin), []);

  haunted.useEffect(() => {
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

  const router = haunted.useMemo(
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

  return litHtml.html`
    <boo-routely-provider .value="${router}">
      ${unsafeHtml_js.unsafeHTML(matched.template)}
    </boo-routely-provider>
  `;
}
const Router = haunted.component(_Router);

function _Link({ to, cssClass }) {
  const router = useContext(RouterContext);
  const navigate = haunted.useCallback(
    event => {
      event.preventDefault();
      router.navigate(to);
    },
    [router, to]
  );

  return litHtml.html`<a href="" @click="${navigate}" class="${cssClass}"><slot></slot></a>`;
}
_Link.observedAttributes = ["to", "css-class"];

const Link = haunted.component(_Link);

customElements.define("boo-link", Link);
customElements.define("boo-routely", Router);

exports.RouterContext = RouterContext;
