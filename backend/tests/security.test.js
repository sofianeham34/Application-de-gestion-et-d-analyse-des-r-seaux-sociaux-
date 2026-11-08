// Tests d'intégration des microservices : authentification et contrôle d'accès.
// Base MongoDB : TEST_MONGODB_URI si défini, sinon une base en mémoire (mongodb-memory-server).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

let mongo;
const servers = [];
const url = {};

async function listen(name, app) {
    const server = await new Promise((resolve) => {
        const s = app.listen(0, () => resolve(s));
    });
    servers.push(server);
    url[name] = `http://localhost:${server.address().port}`;
}

before(async () => {
    // Base neuve à chaque exécution
    let uri = process.env.TEST_MONGODB_URI && `${process.env.TEST_MONGODB_URI.replace(/\/$/, "")}/ascendia-test-${Date.now()}`;
    if (!uri) {
        const { MongoMemoryServer } = require("mongodb-memory-server");
        mongo = await MongoMemoryServer.create();
        uri = mongo.getUri("ascendia-test");
    }
    Object.assign(process.env, {
        MONGODB_URI: uri,
        JWT_SECRET: "secret-de-test",
        INTERNAL_API_KEY: "cle-interne-de-test",
        FACEBOOK_CLIENT_ID: "",
        FACEBOOK_CLIENT_SECRET: "",
    });

    await listen("socialauth", require("../services/socialAuth/server.js"));
    process.env.SOCIALAUTH_URL = url.socialauth;
    await listen("users", require("../services/users/server.js"));
    await listen("posts", require("../services/posts/server.js"));
    process.env.PROXY_SOCIALAUTH = url.socialauth;
    await listen("gateway", require("../gateway/server.js"));
});

after(async () => {
    servers.forEach((s) => s.close());
    for (const svc of ["users", "socialAuth", "posts"]) {
        const mongoose = require(`../services/${svc}/node_modules/mongoose`);
        if (svc === "users" && process.env.TEST_MONGODB_URI) await mongoose.connection.db?.dropDatabase();
        await mongoose.disconnect();
    }
    if (mongo) await mongo.stop();
});

const api = async (base, path, { method = "GET", token, body, headers = {} } = {}) => {
    const res = await fetch(base + path, {
        method,
        headers: {
            ...(body && !(body instanceof FormData) ? { "content-type": "application/json" } : {}),
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data };
};

async function register(username) {
    const { status, data } = await api(url.users, "/register", {
        method: "POST",
        body: { username, email: `${username}@test.fr`, password: "motdepasse1" },
    });
    assert.equal(status, 201);
    return { token: data.token, id: data.user._id };
}

let alice;
let bob;

test("inscription et connexion par email ou nom d'utilisateur", async () => {
    alice = await register("alice");
    bob = await register("bob");

    const parEmail = await api(url.users, "/login", { method: "POST", body: { email: "alice@test.fr", password: "motdepasse1" } });
    assert.equal(parEmail.status, 200);
    assert.equal(parEmail.data.user.password, undefined);

    const parPseudo = await api(url.users, "/login", { method: "POST", body: { email: "alice", password: "motdepasse1" } });
    assert.equal(parPseudo.status, 200);
});

test("connexion : même message que le compte existe ou non", async () => {
    const mauvaisMdp = await api(url.users, "/login", { method: "POST", body: { email: "alice@test.fr", password: "mauvais1" } });
    const inconnu = await api(url.users, "/login", { method: "POST", body: { email: "personne@test.fr", password: "mauvais1" } });
    assert.equal(mauvaisMdp.status, 400);
    assert.deepEqual(mauvaisMdp.data, inconnu.data);
});

test("un utilisateur ne peut pas se donner le rôle admin", async () => {
    const res = await api(url.users, `/${alice.id}`, { method: "PUT", token: alice.token, body: { role: "admin", username: "alice2" } });
    assert.equal(res.status, 200);
    assert.equal(res.data.role, "user");
    assert.equal(res.data.username, "alice2");
});

test("la liste des utilisateurs est réservée aux admins", async () => {
    assert.equal((await api(url.users, "/a", { token: alice.token })).status, 403);
    assert.equal((await api(url.users, "/a")).status, 401);
});

test("on ne peut pas lire ou modifier le profil d'un autre utilisateur", async () => {
    assert.equal((await api(url.users, `/${bob.id}`, { token: alice.token })).status, 403);
    assert.equal((await api(url.users, `/${bob.id}`, { method: "PUT", token: alice.token, body: { username: "pirate" } })).status, 403);
});

test("socialAuth : les connexions d'un utilisateur sont privées", async () => {
    assert.equal((await api(url.socialauth, `/${alice.id}`)).status, 401);
    assert.equal((await api(url.socialauth, `/${bob.id}`, { token: alice.token })).status, 403);
    assert.equal((await api(url.socialauth, `/${alice.id}`, { token: alice.token })).status, 200);
    assert.equal((await api(url.socialauth, `/${bob.id}/facebook`, { method: "DELETE", token: alice.token })).status, 403);
});

test("socialAuth : les tokens ne sont accessibles qu'avec la clé interne", async () => {
    assert.equal((await api(url.socialauth, `/internal/tokens/${alice.id}`)).status, 403);
    assert.equal((await api(url.socialauth, `/internal/tokens/${alice.id}`, { headers: { "x-internal-key": "mauvaise" } })).status, 403);
    const ok = await api(url.socialauth, `/internal/tokens/${alice.id}`, { headers: { "x-internal-key": "cle-interne-de-test" } });
    assert.equal(ok.status, 200);
    assert.ok(Array.isArray(ok.data));
});

test("gateway : la route interne n'est pas exposée publiquement", async () => {
    const res = await api(url.gateway, `/api/socialauth/internal/tokens/${alice.id}`, { headers: { "x-internal-key": "cle-interne-de-test" } });
    assert.equal(res.status, 404);
    const majuscules = await api(url.gateway, `/api/socialAuth/internal/tokens/${alice.id}`);
    assert.equal(majuscules.status, 404);
});

test("socialAuth : un réseau sans clé API est désactivé proprement", async () => {
    const res = await api(url.socialauth, "/connect/facebook");
    assert.equal(res.status, 503);
});

test("posts : authentification obligatoire", async () => {
    assert.equal((await api(url.posts, `/scheduled/${alice.id}`)).status, 401);
    assert.equal((await api(url.posts, `/scheduled/${bob.id}`, { token: alice.token })).status, 403);
    assert.equal((await api(url.posts, "/traduire", { method: "POST", body: { message: "a", langue: "en" } })).status, 401);
});

test("posts : planification, puis seul l'auteur peut voir et supprimer son post", async () => {
    const form = new FormData();
    form.append("message", "Bonjour le monde");
    form.append("networks[]", "facebook");
    form.append("scheduleDate", new Date(Date.now() + 3600_000).toISOString());
    const created = await api(url.posts, "/schedule", { method: "POST", token: alice.token, body: form });
    assert.equal(created.status, 201);

    const liste = await api(url.posts, `/scheduled/${alice.id}`, { token: alice.token });
    assert.equal(liste.data.length, 1);
    assert.deepEqual(liste.data[0].platform, ["facebook"]);

    const id = created.data.id;
    assert.equal((await api(url.posts, `/${id}`, { token: bob.token })).status, 403);
    assert.equal((await api(url.posts, `/${id}`, { method: "DELETE", token: bob.token })).status, 403);
    assert.equal((await api(url.posts, `/${id}`, { method: "DELETE", token: alice.token })).status, 200);
});

test("posts : date passée et fichier non image refusés", async () => {
    const passe = new FormData();
    passe.append("message", "Trop tard");
    passe.append("networks", JSON.stringify(["twitter"]));
    passe.append("scheduleDate", "2020-01-01T10:00:00Z");
    assert.equal((await api(url.posts, "/schedule", { method: "POST", token: alice.token, body: passe })).status, 400);

    const fichier = new FormData();
    fichier.append("message", "Avec un fichier");
    fichier.append("networks", JSON.stringify(["twitter"]));
    fichier.append("file", new Blob(["#!/bin/sh"], { type: "text/x-sh" }), "script.sh");
    fichier.append("scheduleDate", new Date(Date.now() + 3600_000).toISOString());
    assert.equal((await api(url.posts, "/schedule", { method: "POST", token: alice.token, body: fichier })).status, 400);
});

test("posts : publier sans compte connecté renvoie un résultat par réseau", async () => {
    const form = new FormData();
    form.append("message", "Test");
    form.append("networks", JSON.stringify(["twitter"]));
    const res = await api(url.posts, "/", { method: "POST", token: alice.token, body: form });
    assert.equal(res.status, 502);
    assert.deepEqual(res.data.results, [{ network: "twitter", ok: false, error: "Compte non connecté" }]);
});
