importScripts("./IDB.js");

const db = new IDB("res-img", 1, {
  onupgradeneeded: (e) => {
    const db = e.target.result;
    const objStore = db.createObjectStore("img", {
      autoIncrement: true,
      keyPath: "id",
    });
    objStore.createIndex("name", "name", { unique: true });
  },
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = e.request.url;

  if (e.request.method == "POST" && url.indexOf("update-img") > -1) {
    e.respondWith(
      e.request.formData().then((data) => {
        const file = data.get("img");
        const name = Date.now() + Math.random().toString().substr(2, 4);

        db.put("img", { name, file });
        return new Response(
          JSON.stringify({
            name: name + ".dbimg",
          })
        );
      })
    );
  }

  if (e.request.method == "GET" && url.substr(url.length - 6) == ".dbimg") {
    const name = url.substring(url.lastIndexOf("/") + 1, url.lastIndexOf("."));

    e.respondWith(
      db
        .getAllMatching("img", { index: "name", query: IDBKeyRange.only(name) })
        .then((data) => {
          if (data.length) {
            return new Response(data[0].file);
          }

          return new Response("", { status: 404 });
        })
    );
  }

  if (e.request.method == "GET" && url.indexOf("get-uploads.json") > -1) {
    e.respondWith(
      db.getAllMatching("img").then((data) => {
        return new Response(JSON.stringify(data));
      })
    );
  }

  if (e.request.method == "DELETE" && url.indexOf("remove-uploads-img") > -1) {
    const id = new URL(e.request.url).searchParams.get("id");

    id && e.respondWith(db.delete("img", +id).then(() => new Response("")));
  }
});
