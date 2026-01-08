import { createBrowserRouter } from "react-router";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Admin from "./pages/Admin";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        path: "/",
        Component: Home,
      },
      {
        path: "/admin",
        Component: Admin,
      },
    ],
  },
]);
export default router;
