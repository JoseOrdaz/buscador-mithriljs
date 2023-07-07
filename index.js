
export function Buscador() {
  let state = {
      limit: 24,
      offset: 0,
      title: "",
      body: "",
    },
    fetchCollection,
    collectionImg,
    filter,
    href,
    firstLoad = true,
    isLoaded = false,
    json = {},
    defaultImg,
    className,
    realm,
    totalResults = 0;

  const cdn = "https://cdn.digitalvalue.es";

  async function getData() {
    if (state.title.length < 3) return;
    totalResults = 0;
    isLoaded = true;
    const query = `&or=title=/${state.title}/i|title.und=/${state.title}/i|title.va=/${state.title}/i|title.es=/${state.title}/i|title.ca=/${state.title}||&or=body=/${state.body}/i|body.und=/${state.body}/i|body.va=/${state.body}/i|title.es=/${state.body}/i|title.ca=/${state.body}/i`;

    if (typeof fetchCollection === "string") {
      const url = `${cdn}/${realm}/collections/${fetchCollection}?limit=${state.limit}&offset=${state.offset}${query}${filter}&fields=title,lead,data,name,body`;
      m.request(url, { background: false })
        .then((request) => {
          json = request;
          totalResults = json.itemsCount;
          setTimeout(() => {
            isLoaded = false;
            m.redraw();
          }, 1000);
        })
        .catch((error) => {
          isLoaded = false;
          json.items = [];
          m.redraw();
        });
    } else if (Array.isArray(fetchCollection)) {
      let requests = fetchCollection.map((collection) => {
        const url = `${cdn}/${realm}/collections/${collection.name}?limit=${state.limit}&offset=${state.offset}${query}${filter}&fields=title,lead,data,name,body`;
        return fetch(url)
          .then((response) => response.json())
          .then((data) => {
            totalResults += data.itemsCount || 0;
            json[collection.name] = {
              href: collection.href,
              title: collection.title,
              body: collection.body,
              items: data.items || [],
            };
          });
      });
      await Promise.all(requests).then((resp) => (isLoaded = false));
    }
  }

  return {
    oninit: async ({ attrs }) => {
      //console.log('INIT: ')
      const paramsString = window.location.search;
      realm = attrs.realm;
      let searchParams = new URLSearchParams(paramsString);
      if (searchParams.has("offset"))
        state.offset = Number(searchParams.get("offset"));
      if (searchParams.has("query"))
        state.title = searchParams.get("query");
        state.body = searchParams.get("query");

      className = attrs.className || "div";
      fetchCollection = attrs.fetchCollection || attrs.collections;
      filter = attrs.filter || "";
      href = attrs.href || null;
      defaultImg = attrs.defaultImg || null;
      collectionImg = attrs.collectionImg || null;
      state.limit = attrs.limit || 24;

      Object.assign(state, attrs.state);

      getData();
      firstLoad = false;
    },
    view: () => {
      if (firstLoad) return null;
      
      return [
        m(SearchForm, { clicked: getData }),
        !isLoaded
          ? [
              totalResults
                ? [
                    m(NumeroResultados, { num: totalResults }),
                    m(Items),
                    m(Paginador, {
                      total: totalResults,
                      limit: state.limit,
                      offset: state.offset,
                      onchange: (page) => {
                        const pageNum = page > 0 ? page - 1 : page;
                        state.offset = pageNum * state.limit;
                        getData();
                      },
                    }),
                  ]
                : m(NoHayResultados),
            ]
          : m(Spinner, {
              controller: isLoaded,
              close: () => (isLoaded = false),
            }),
      ];
    },
  };



  function NoHayResultados() {

    

    const translated = {
      emptyResult: { va: "No hi ha resultats", es: "No hay resultados" },
    };
    return {
      view: () => {
        
        return [
          totalResults < 0 ? [ 
        m("p", m(".rounded.border-s-4.border-red-500.bg-red-50.p-4[role='alert']",
      [
        m("div.flex.items-center.gap-2.text-red-800",
          [
            m("svg.h-5.w-5[xmlns='http://www.w3.org/2000/svg'][viewBox='0 0 24 24'][fill='currentColor']", 
              m("path[fill-rule='evenodd'][d='M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z'][clip-rule='evenodd']")
            ),
            m("strong.block.font-medium", localize(translated.emptyResult)),
          ]
        )

      ]
    ))]
      : null
    ]

    }
  
  };
  }


  function Items() {
    return {
      view: () => {
        if (typeof json === "object") {
          return m("div.mt-5.mb-5.flex.flex-col.text-left", [
            Object.keys(json).map((key) => {
              if (json[key].items && json[key].items.length > 0) {
                return json[key].items.map((item) =>
                  m(Item, {
                    item: item,
                    href: json[key].href,
                    label: json[key].title,
                  })
                );
              }
            }),
          ]);
        } else {
          return m(className, [
            json.items.map((item) => m(Item, { item })),
          ]);
        }
        console.log("items: ", json);
      },
    };
    function Item() {
      return {
        view: ({ attrs }) => {
          const { item, href, collections, label } = attrs;
          const { lead, data, title, _id, name, body } = item;
          console.log(item);
          let slug;
          if (data && data.slug !== "") {
            slug = localize(data.slug);
          } else if (name) {
            slug = name;
          } else {
            slug = _id;
          }
          let linkHref = "";
          if (href && href != "no-link") {
           linkHref = `https://transparencia.denia.es/es/${href}/${slug}?offset=${state.offset}`;
          
          }
          return m(
            "a.group.bg-white.border.shadow-sm.rounded-xl.hover:shadow-md.transition.dark:bg-slate-900.dark:border-gray-800.p-4.md:p-5.mb-3",
            {
              href: linkHref,
            },
            [
              label
                ? m(
                    "span.whitespace-nowrap.rounded-full.bg-amber-100.px-2.5.py-1.text-sm.text-amber-700",
                    localize(label)
                  )
                : null,
              m(
                "h3.group-hover:text-amber-600.font-semibold.text-gray-800.dark:group-hover:text-gray-400.dark:text-gray-200.mt-2",
                localize(title)
              )]
          );
        },
      };
    }
  }

  function NumeroResultados() {
    const title = {
      es: "Nº de resultados encontrados: ",
      va: "Nº de resultados encontrados:: ",
    };

    const subtitle = {
      es: " resultados",
      va: " resultados",
    };
    return {
      view: ({ attrs }) =>
        m(
          "div.inline-flex.items-center.gap-1.5.py-1.5.px-3.rounded-md.text-xs.font-medium.bg-gray-100.text-gray-800.dark:bg-gray-800.dark:text-gray-200",
          localize(title) + attrs.num + localize(subtitle)
        ),
    };
  }
  function SearchForm() {
    const translated = {
      title: { va: "Cercador", es: "Buscador" },
      restablecer: { va: "Netejar", es: "Limpiar" },
      placeholder: {
        va: "Presupuesto, Plenos, Equipo de gobierno...",
        es: "Presupuesto, Plenos, Equipo de gobierno...",
      },
      //placeholder: { va: "Mínim 3 caràcters", es: "Mínimo 3 caracteres" },
    };
    return {
      view: () =>
        m("div.mb-12", [
          m(
            "div",
            { class: "relative overflow-hidden" },
            m(
              "div",
              {
                class: "max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 pb-10",
              },
              m(
                "div",
                { class: "text-center" },
                m(
                  "div",
                  { class: "mt-7 sm:mt-12 mx-auto max-w-xl relative" },
                  [
                    m(
                      "div",
                      m(
                        "div",
                        {
                          class:
                            "relative z-10 flex space-x-3 p-3 bg-white border rounded-lg shadow-lg shadow-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:shadow-gray-900/[.2]",
                        },
                        [
                          m("div", { class: "flex-[1_0_0%]" }, [
                            m(
                              "label",
                              {
                                class:
                                  "block text-sm text-gray-700 font-medium dark:text-white",
                                for: "hs-search-article-1",
                              },
                              m(
                                "span",
                                { class: "sr-only" },
                                "Search article"
                              )
                            ),
                            m("input", {
                              class:
                                "p-3 block w-full border-transparent rounded-md focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-400",
                              type: "text",
                              id: "myInput",
                              value: state.title || state.body,
                              placeholder: localize(translated.placeholder),
                              oninput: (e) => {
                                state.title = e.target.value;
                                state.body = e.target.value;

                              },
                              onkeyup: (e) => {
                                if (e.keyCode == 13) {
                                  
                                  getData();
                                  
                                }
                              },
                            }),
                          ]),
                          m(
                            "div",
                            { class: "flex-[0_0_auto]" },
                            m(
                              "a",
                              {
                                class:
                                  "p-4 inline-flex justify-center items-center gap-2 rounded-md border border-transparent font-semibold bg-[var(--color-principal)] text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800 cursor-pointer",
                                onclick: () => {
                                  state.title = "";
                                  state.body = ""

                                  m.redraw();
                                },
                                onclick: () => getData(),
                              },
                              m(
                                "svg",
                                {
                                  xmlns: "http://www.w3.org/2000/svg",
                                  width: "16",
                                  height: "16",
                                  fill: "currentColor",
                                  viewBox: "0 0 16 16",
                                },
                                m("path", {
                                  d: "M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z",
                                })
                              )
                            )
                          ),
                        ]
                      )
                    ),
                    m(
                      "div",
                      {
                        class:
                          "hidden md:block absolute top-0 right-0 -translate-y-12 translate-x-20",
                      },
                      m(
                        "svg",
                        {
                          class: "w-16 h-auto text-orange-500",
                          width: "121",
                          height: "135",
                          viewBox: "0 0 121 135",
                          fill: "none",
                          xmlns: "http://www.w3.org/2000/svg",
                        },
                        [
                          m("path", {
                            d: "M5 16.4754C11.7688 27.4499 21.2452 57.3224 5 89.0164",
                            stroke: "currentColor",
                            "stroke-width": "10",
                            "stroke-linecap": "round",
                          }),
                          m("path", {
                            d: "M33.6761 112.104C44.6984 98.1239 74.2618 57.6776 83.4821 5",
                            stroke: "currentColor",
                            "stroke-width": "10",
                            "stroke-linecap": "round",
                          }),
                          m("path", {
                            d: "M50.5525 130C68.2064 127.495 110.731 117.541 116 78.0874",
                            stroke: "currentColor",
                            "stroke-width": "10",
                            "stroke-linecap": "round",
                          }),
                        ]
                      )
                    ),
                    m(
                      "div",
                      {
                        class:
                          "hidden md:block absolute bottom-0 left-0 translate-y-10 -translate-x-32",
                      },
                      m(
                        "svg",
                        {
                          class: "w-40 h-auto text-cyan-500",
                          width: "347",
                          height: "188",
                          viewBox: "0 0 347 188",
                          fill: "none",
                          xmlns: "http://www.w3.org/2000/svg",
                        },
                        m("path", {
                          d: "M4 82.4591C54.7956 92.8751 30.9771 162.782 68.2065 181.385C112.642 203.59 127.943 78.57 122.161 25.5053C120.504 2.2376 93.4028 -8.11128 89.7468 25.5053C85.8633 61.2125 130.186 199.678 180.982 146.248L214.898 107.02C224.322 95.4118 242.9 79.2851 258.6 107.02C274.299 134.754 299.315 125.589 309.861 117.539L343 93.4426",
                          stroke: "currentColor",
                          "stroke-width": "7",
                          "stroke-linecap": "round",
                        })
                      )
                    ),
                  ]
                )
              )
            )
          ),
        ]),
    };
  }
}

function Spinner() {
  return {
    oninit: ({ attrs }) => {
      const { close } = attrs;
      setTimeout(() => {
        if (typeof close == "function") close();
        m.redraw();
      }, 1000);
    },
    view: ({ attrs }) => {
      const { controller } = attrs;
      if (!controller) return;
      return m(".spinner", [
        m("div", {
          class:
            "mx-auto mt-20 w-12 h-12 rounded-full animate-spin\n border-8 border-solid border-[var(--color-principal)] border-t-transparent shadow-md",
        }),
      ]);
    },
  };
}
function Paginador() {
  let page = 1;
  let items = [];

  return {
    view: ({ attrs }) => {
      // console.log(attrs)
      items = [];
      let { total, limit = 20, offset, onchange } = attrs;
      const total_paginas = Math.ceil(total / limit);
      if (total_paginas === 1) return null;

      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());

      if (params.limit && params.offset)
        page = params.offset / params.limit + 1;
      else if (offset) {
        page = offset / limit + 1;
      }

      let pagina_actual = page;
      const lastOffset = Math.floor(total / limit) + 1;

      let i = Math.max(pagina_actual - 4, 1);
      for (; i < pagina_actual + 4 && i < total_paginas - 1; i++) {
        items.push({
          offset: i * limit,
          page: i + 1,
        });
      }

      return m(
        "div.p-6.flex.justify-center.font-sans.antialiased",
        m("ol.flex.justify-center.gap-1.text-xs.font-medium", [
          pagina_actual > 1
            ? m(
                "a.inline-flex.h-8.w-8.items-center.justify-center.rounded.border.border-gray-100.bg-white.text-gray-900.rtl:rotate-180.cursor-pointer.hover:shadow-md",
                {
                  onclick: () => {
                    if (onchange) onchange(1);
                  },
                },
                m(
                  "svg.h-3.w-3[xmlns='http://www.w3.org/2000/svg'][viewBox='0 0 20 20'][fill='currentColor']",
                  m(
                    "path[fill-rule='evenodd'][d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'][clip-rule='evenodd']"
                  )
                )
              )
            : null,
          m(
            "a.item.icon.cursor-pointer.block.h-8.w-8.rounded.border.border-gray-100.bg-white.text-center.leading-8.text-gray-900.cursor-pointer.hover:shadow-md",
            {
              className: pagina_actual === 1 ? "active bg-[var(--color-principal)] text-white" : "",
              onclick: () => {
                if (onchange) onchange(1);
              },
            },
            "1"
          ),
          pagina_actual > 5
            ? m(
                "a.item.icon.cursor-pointer.block.h-8.w-8.rounded.border.border-gray-100.bg-white.text-center.leading-8.text-gray-900.cursor-pointer.hover:shadow-md",
                "..."
              )
            : null,
          items.map((item) =>
            m(
              "a.item.icon.cursor-pointer.block.h-8.w-8.rounded.border.border-gray-100.bg-white.text-center.leading-8.text-gray-900.cursor-pointer.hover:shadow-md",
              {
                className: item.page === pagina_actual ? "active bg-[var(--color-principal)] text-white" : "",
                onclick: () => {
                  if (onchange) onchange(item.page);
                },
              },
              item.page
            )
          ),

          pagina_actual < total_paginas - 5
            ? m(
                "a.item.icon.cursor-pointer.block.h-8.w-8.rounded.border.border-gray-100.bg-white.text-center.leading-8.text-gray-900.cursor-pointer.hover:shadow-md",
                "..."
              )
            : null,
          m(
            "a.item.icon.cursor-pointer.block.h-8.w-8.rounded.border.border-gray-100.bg-white.text-center.leading-8.text-gray-900.cursor-pointer.hover:shadow-md",
            {
              className: total_paginas === page ? "active bg-[var(--color-principal)] text-white" : "",
              onclick: () => {
                if (onchange) onchange(total_paginas);
              },
            },
            total_paginas
          ),
          page < lastOffset
            ? m(
                "a.inline-flex.h-8.w-8.items-center.justify-center.rounded.border.border-gray-100.bg-white.text-gray-900.rtl:rotate-180.cursor-pointer.cursor-pointer.hover:shadow-md",
                {
                  onclick: () => {
                    if (onchange) onchange(total_paginas++);
                  },
                },
                m(
                  "svg.h-3.w-3[xmlns='http://www.w3.org/2000/svg'][viewBox='0 0 20 20'][fill='currentColor']",
                  m(
                    "path[fill-rule='evenodd'][d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'][clip-rule='evenodd']"
                  )
                )
              )
            : null,
        ])
      );
    },
  };
}
function localize(item) {
  const locale = localStorage.lang;
  if (typeof item === "string") return item;

  if (typeof item === "object") {
    let resp =
      item[locale] ||
      item.und ||
      item.es ||
      item.va ||
      item.ca ||
      item[0] ||
      "";

    return resp;
  }
}

