import { RouterProvider, createBrowserRouter } from "react-router-dom";
import routes from "~react-pages";
import PrivateRoute from "./components/PrivateRoute";

// Pages accessibles sans être connecté ; toutes les autres sont protégées.
const publicRoutes = ["/", "homepage", "login", "register", "privacy"];

const protect = (route) => {
    if (route.children) return { ...route, children: route.children.map(protect) };
    return { ...route, element: <PrivateRoute>{route.element}</PrivateRoute> };
};

const router = createBrowserRouter(
    routes.map((route) => (publicRoutes.includes((route.path || "").toLowerCase()) ? route : protect(route)))
);

function App() {
    return <RouterProvider router={router} />;
}

export default App;
