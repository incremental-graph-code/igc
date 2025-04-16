import { createBrowserRouter, Navigate } from "react-router-dom";

import LoginPage from "../pages/login";
import HomePage from "../pages/home";
import { isLoggedIn } from "../utils/requests";

// Create router
const AppRouter = createBrowserRouter([
    {
        path: "/",
        element: isLoggedIn() ? (
            <Navigate to="/home" replace />
        ) : (
            <Navigate to="/login" replace />
        )
    },
    {
        path: "/login",
        element: isLoggedIn() ? <Navigate to="/home" replace /> : <LoginPage />
    },
    {
        path: "/home",
        element: isLoggedIn() ? <HomePage /> : <Navigate to="/login" replace />
    }
]);
export default AppRouter;
